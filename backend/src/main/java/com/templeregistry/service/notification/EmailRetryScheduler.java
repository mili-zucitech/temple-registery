package com.templeregistry.service.notification;

import com.templeregistry.repository.notification.EmailOutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * Monitoring scheduler for the email delivery pipeline.
 *
 * <p>Email retries are now handled by
 * {@link com.templeregistry.service.notification.impl.EmailDeliveryService#processRetries()}
 * which reads from the DB-backed {@link com.templeregistry.entity.notification.EmailOutbox}
 * with full render context and exponential back-off.
 *
 * <p>This scheduler monitors for DEAD_LETTER emails (permanently failed) and logs
 * an alert so ops teams can investigate. It no longer drives SMTP delivery.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EmailRetryScheduler {

    private final EmailOutboxRepository emailOutboxRepository;

    /**
     * Runs every 10 minutes and logs a WARNING if any emails are permanently dead-lettered.
     * DEAD_LETTER emails require manual investigation (bad template, invalid recipient, etc.).
     */
    @Scheduled(fixedDelay = 10, timeUnit = TimeUnit.MINUTES)
    public void monitorDeadLetterQueue() {
        long deadLetterCount = emailOutboxRepository.countByStatus("DEAD_LETTER");
        if (deadLetterCount > 0) {
            log.error("[EmailMonitor] {} email(s) are DEAD_LETTER and require manual review. "
                + "Check email_outbox table for last_failure_reason details.", deadLetterCount);
        } else {
            log.debug("[EmailMonitor] Email outbox healthy — no DEAD_LETTER items.");
        }

        long pendingCount = emailOutboxRepository.countByStatus("PENDING");
        long failedCount  = emailOutboxRepository.countByStatus("FAILED");
        if (pendingCount > 100 || failedCount > 20) {
            log.warn("[EmailMonitor] High email backlog — PENDING={} FAILED={}", pendingCount, failedCount);
        }
    }
}

