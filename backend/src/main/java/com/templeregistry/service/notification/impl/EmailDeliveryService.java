package com.templeregistry.service.notification.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.notification.EmailOutbox;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.notification.EmailOutboxRepository;
import com.templeregistry.service.notification.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * DB-backed email delivery service.
 *
 * <p>Replaces the former in-memory {@code LinkedBlockingQueue} which silently dropped
 * emails on JVM restart and had no retry capability.
 *
 * <h3>Architecture</h3>
 * <pre>
 *   NotificationDispatchServiceImpl.dispatch()
 *     → EmailDeliveryService.enqueue()   [persists to email_outbox — durable]
 *     → processQueue() every 10 s        [PENDING rows → SMTP → SENT]
 *     → processRetries() every 5 min     [FAILED rows w/ backoff → SMTP → SENT | DEAD_LETTER]
 * </pre>
 *
 * <h3>Exponential back-off schedule</h3>
 * Attempt 1: immediate &nbsp;| Attempt 2: +1 min &nbsp;| Attempt 3: +5 min &nbsp;|
 * Attempt 4: +30 min &nbsp;| Attempt 5: +2 h &nbsp;| Attempt 6+: DEAD_LETTER
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailDeliveryService {

    private final EmailService emailService;
    private final EmailOutboxRepository emailOutboxRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    // ─── Enqueue ─────────────────────────────────────────────────────────────

    /**
     * Persist an email delivery request to the DB outbox.
     * The recipient email is resolved at enqueue time and stored so retries
     * always deliver to the same address even if the user changes their email.
     */
    public void enqueue(EmailRequest request) {
        try {
            String recipientEmail = resolveEmail(request.getRecipientId());
            if (recipientEmail == null || recipientEmail.isBlank()) {
                log.warn("[EmailDelivery] No email for userId={} — skipping enqueue", request.getRecipientId());
                return;
            }

            String contextJson = serializeContext(request.getMetadata());

            EmailOutbox outbox = EmailOutbox.builder()
                .recipientUserId(request.getRecipientId())
                .recipientEmail(recipientEmail)
                .subject(request.getSubject())
                .templateKey(request.getTemplateKey())
                .contextJson(contextJson)
                .entityType(request.getEntityType())
                .entityId(request.getEntityId())
                .status("PENDING")
                .priority(derivePriority(request))
                .build();

            emailOutboxRepository.save(outbox);
            log.debug("[EmailDelivery] Enqueued outbox id for userId={} template={}", request.getRecipientId(), request.getTemplateKey());

        } catch (Exception e) {
            log.error("[EmailDelivery] Failed to enqueue email for userId={}: {}",
                request.getRecipientId(), e.getMessage());
            // Do NOT rethrow — a failed enqueue must not roll back the calling workflow transaction.
        }
    }

    // ─── Scheduled Workers ───────────────────────────────────────────────────

    /**
     * Primary delivery worker — processes PENDING rows every 10 seconds.
     * HIGH/CRITICAL items are ordered first by the repository query.
     */
    @Scheduled(fixedDelay = 10, timeUnit = TimeUnit.SECONDS)
    @Transactional
    public void processQueue() {
        List<EmailOutbox> pending = emailOutboxRepository.findPendingBatch(50);
        if (pending.isEmpty()) return;

        log.debug("[EmailDelivery] Processing {} pending email(s)", pending.size());

        for (EmailOutbox outbox : pending) {
            deliver(outbox);
            emailOutboxRepository.save(outbox);
        }
    }

    /**
     * Retry worker — re-attempts FAILED rows every 5 minutes using exponential back-off.
     * Rows that exhaust {@code max_retries} are moved to {@code DEAD_LETTER}.
     */
    @Scheduled(fixedDelay = 5, timeUnit = TimeUnit.MINUTES)
    @Transactional
    public void processRetries() {
        List<EmailOutbox> retryable = emailOutboxRepository.findRetryableBatch(Instant.now(), 20);
        if (retryable.isEmpty()) return;

        log.info("[EmailDelivery] Retrying {} failed email(s)", retryable.size());

        for (EmailOutbox outbox : retryable) {
            deliver(outbox);
            emailOutboxRepository.save(outbox);
        }

        long deadLetterCount = emailOutboxRepository.countByStatus("DEAD_LETTER");
        if (deadLetterCount > 0) {
            log.error("[EmailDelivery] {} email(s) in DEAD_LETTER — manual review required", deadLetterCount);
        }
    }

    // ─── Delivery Core ────────────────────────────────────────────────────────

    private void deliver(EmailOutbox outbox) {
        try {
            Map<String, Object> context = deserializeContext(outbox.getContextJson());
            emailService.sendNotification(
                outbox.getRecipientUserId(), outbox.getSubject(),
                outbox.getTemplateKey(), context);

            outbox.setStatus("SENT");
            outbox.setSentAt(Instant.now());
            log.info("[EmailDelivery] SENT outbox id={} recipient=[{}] template={}",
                outbox.getId(), outbox.getRecipientEmail(), outbox.getTemplateKey());

        } catch (Exception e) {
            outbox.setRetryCount(outbox.getRetryCount() + 1);
            outbox.setLastFailureReason(truncate(e.getMessage(), 2000));

            if (outbox.getRetryCount() >= outbox.getMaxRetries()) {
                outbox.setStatus("DEAD_LETTER");
                log.error("[EmailDelivery] DEAD_LETTER outbox id={} recipient=[{}] after {} attempt(s): {}",
                    outbox.getId(), outbox.getRecipientEmail(), outbox.getRetryCount(), e.getMessage());
            } else {
                outbox.setStatus("FAILED");
                outbox.setNextRetryAt(computeNextRetry(outbox.getRetryCount()));
                log.warn("[EmailDelivery] FAILED outbox id={} recipient=[{}] attempt={}/{} next={}",
                    outbox.getId(), outbox.getRecipientEmail(),
                    outbox.getRetryCount(), outbox.getMaxRetries(), outbox.getNextRetryAt());
            }
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private String resolveEmail(Long userId) {
        if (userId == null) return null;
        return userRepository.findById(userId).map(User::getEmail).orElse(null);
    }

    private String serializeContext(Map<String, Object> metadata) throws JsonProcessingException {
        return objectMapper.writeValueAsString(metadata != null ? metadata : Map.of());
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> deserializeContext(String contextJson) {
        try {
            return objectMapper.readValue(contextJson, Map.class);
        } catch (Exception e) {
            log.warn("[EmailDelivery] Failed to deserialize context — using empty map: {}", e.getMessage());
            return Map.of();
        }
    }

    /**
     * Exponential back-off: 1 min → 5 min → 30 min → 2 h → 12 h.
     */
    private Instant computeNextRetry(int attemptNumber) {
        long delaySeconds = switch (attemptNumber) {
            case 1  -> 60;
            case 2  -> 300;
            case 3  -> 1_800;
            case 4  -> 7_200;
            default -> 43_200;
        };
        return Instant.now().plusSeconds(delaySeconds);
    }

    private String derivePriority(EmailRequest request) {
        if (request.getMetadata() == null) return "MEDIUM";
        Object p = request.getMetadata().get("priority");
        if (p == null) return "MEDIUM";
        String ps = p.toString().toUpperCase();
        return switch (ps) {
            case "CRITICAL", "HIGH" -> ps;
            case "LOW"              -> "LOW";
            default                 -> "MEDIUM";
        };
    }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
