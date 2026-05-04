package com.templeregistry.service.notification.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.entity.notification.NotificationOutbox;
import com.templeregistry.entity.notification.NotificationRule;
import com.templeregistry.event.workflow.GovernanceDomainEvent;
import com.templeregistry.repository.notification.NotificationOutboxRepository;
import com.templeregistry.repository.notification.NotificationRuleRepository;
import com.templeregistry.service.notification.NotificationRecipientResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * NotificationRouter — the single notification pipeline.
 *
 * Replaces:
 *   - NotificationHelper (888-line god class with 20+ hardcoded methods)
 *   - NotificationEventPublisherImpl (legacy — creates event rows, no in-app delivery)
 *   - Legacy NotificationService.notify() (basic in-app only, no email/SSE)
 *
 * Flow:
 *   1. Outbox dispatcher reads PENDING rows from notification_outbox every 5 seconds.
 *   2. Deserializes GovernanceDomainEvent.
 *   3. Looks up matching notification_rules (event_type + entity_type + action).
 *   4. Resolves recipients for each rule (TA/DC/ADMIN).
 *   5. For each recipient: creates in-app notification, queues email if needed, pushes SSE.
 *   6. Marks outbox row as DISPATCHED.
 *
 * Also listens to GovernanceDomainEvent in-process for fast SSE delivery (best-effort).
 * The outbox provides durability for email and in-app persistence.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationRouter {

    private final NotificationOutboxRepository outboxRepo;
    private final NotificationRuleRepository ruleRepo;
    private final NotificationRecipientResolver recipientResolver;
    private final NotificationDispatchServiceImpl dispatchService;
    private final NotificationDeduplicationGuard deduplicationGuard;
    private final ObjectMapper objectMapper;

    // ─── In-Process Fast Path (AFTER_COMMIT — best-effort SSE) ──────────────

    /**
     * Listens to GovernanceDomainEvent published by WorkflowEngine AFTER TX commit.
     * Provides fast SSE push without waiting for the outbox scheduler.
     * The outbox provides durability — this is the speed path.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async("taskExecutor")
    public void onGovernanceDomainEvent(GovernanceDomainEvent event) {
        try {
            log.debug("[NotificationRouter] In-process event: {}/{}/{}",
                event.eventType(), event.entityType(), event.action());
            route(event);
        } catch (Exception e) {
            log.warn("[NotificationRouter] In-process routing failed (outbox will retry): {}", e.getMessage());
            // Non-fatal — outbox dispatcher will handle delivery
        }
    }

    // ─── Outbox Dispatcher (primary — guaranteed delivery) ────────────────────

    @Scheduled(fixedDelay = 5, timeUnit = TimeUnit.SECONDS)
    @Transactional
    public void dispatchPending() {
        List<NotificationOutbox> pending = outboxRepo.findPendingBatch(50);
        if (pending.isEmpty()) return;

        for (NotificationOutbox outbox : pending) {
            try {
                GovernanceDomainEvent event = objectMapper.readValue(
                    outbox.getEventPayloadJson(), GovernanceDomainEvent.class);
                log.info("[FLOW_1] router picked outbox id={} eventType={} action={} entityType={} entityId={} districtId={} templeId={}",
                    outbox.getId(), event.eventType(),
                    event.action() != null ? event.action().name() : "null",
                    event.entityType() != null ? event.entityType().name() : "null",
                    event.entityId(), event.districtId(), event.templeId());
                route(event);
                outbox.setDispatchStatus("DISPATCHED");
                outbox.setDispatchedAt(Instant.now());
            } catch (Exception e) {
                log.error("[FLOW_1] router FAILED outbox id={} cause={}", outbox.getId(), e.getMessage(), e);
                outbox.setDispatchStatus("FAILED");
                outbox.setRetryCount(outbox.getRetryCount() + 1);
                outbox.setLastError(e.getMessage());
            }
            outboxRepo.save(outbox);
        }
    }

    @Scheduled(fixedDelay = 60, timeUnit = TimeUnit.SECONDS)
    @Transactional
    public void retryFailed() {
        List<NotificationOutbox> failed = outboxRepo.findRetryableBatch(20);
        for (NotificationOutbox outbox : failed) {
            try {
                GovernanceDomainEvent event = objectMapper.readValue(
                    outbox.getEventPayloadJson(), GovernanceDomainEvent.class);
                route(event);
                outbox.setDispatchStatus("DISPATCHED");
                outbox.setDispatchedAt(Instant.now());
            } catch (Exception e) {
                outbox.setRetryCount(outbox.getRetryCount() + 1);
                outbox.setLastError(e.getMessage());
                if (outbox.getRetryCount() >= 3) {
                    outbox.setDispatchStatus("FAILED");
                    log.error("[NotificationRouter] Max retries exhausted for outbox id={}", outbox.getId());
                }
            }
            outboxRepo.save(outbox);
        }
    }

    // ─── Core Routing Logic ───────────────────────────────────────────────────

    public void route(GovernanceDomainEvent event) {
        String entityTypeName = event.entityType() != null ? event.entityType().name() : "*";
        String actionName = event.action() != null ? event.action().name() : "";

        List<NotificationRule> matchingRules = ruleRepo.findMatchingRules(
            event.eventType(), entityTypeName, actionName);

        if (matchingRules.isEmpty()) {
            log.debug("[NotificationRouter] No rules matched for event={}/{}/{}", event.eventType(), entityTypeName, actionName);
            return;
        }

        for (NotificationRule rule : matchingRules) {
            // Resolve recipients based on rule.recipientType (TA, DC, ADMIN)
            List<Long> recipientIds = resolveRecipients(rule, event);
            log.info("[FLOW_2] resolved recipients rule={} recipientType={} channel={} count={} ids={}",
                rule.getTemplateKey(), rule.getRecipientType(), rule.getChannel(),
                recipientIds.size(), recipientIds);

            for (Long recipientId : recipientIds) {
                String dedupKey = buildDedupKey(event, rule, recipientId);
                if (deduplicationGuard.isDuplicate(dedupKey)) {
                    log.info("[FLOW_2] dedup skip recipientId={} key={}", recipientId, dedupKey);
                    continue;
                }

                // Dispatch based on channel (IN_APP, EMAIL, BOTH)
                dispatchService.dispatch(event, rule, recipientId);
                deduplicationGuard.markSeen(dedupKey);
            }
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private List<Long> resolveRecipients(NotificationRule rule, GovernanceDomainEvent event) {
        return switch (rule.getRecipientType()) {
            case "TA"    -> java.util.Arrays.asList(recipientResolver.getTempleAuthorityIds(event.templeId()));
            case "DC"    -> java.util.Arrays.asList(recipientResolver.getDistrictCollectorIds(event.districtId()));
            case "ADMIN" -> java.util.Arrays.asList(recipientResolver.getSuperAdminIds());
            default      -> List.of();
        };
    }

    private String buildDedupKey(GovernanceDomainEvent event, NotificationRule rule, Long recipientId) {
        return String.join("|",
            event.eventType(),
            event.entityType() != null ? event.entityType().name() : "UNKNOWN",
            String.valueOf(event.entityId()),
            event.action() != null ? event.action().name() : "UNKNOWN",
            String.valueOf(recipientId),
            rule.getChannel()
        );
    }
}
