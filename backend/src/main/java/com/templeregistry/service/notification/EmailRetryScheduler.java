package com.templeregistry.service.notification;

import com.templeregistry.entity.notification.EmailDeliveryLog;
import com.templeregistry.repository.notification.EmailDeliveryLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled job to retry failed email deliveries.
 * Runs every 5 minutes (300000 ms).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EmailRetryScheduler {

    private static final int MAX_RETRIES = 3;
    private static final String STATUS_FAILED = "FAILED";
    private static final String STATUS_RETRYING = "RETRYING";
    private static final String STATUS_SENT = "SENT";

    private final EmailDeliveryLogRepository emailDeliveryLogRepository;
    private final EmailService emailService;

    /**
     * Retries failed email deliveries.
     * Picks up EmailDeliveryLog records with status=FAILED and retry_count < MAX_RETRIES.
     */
    @Scheduled(fixedDelay = 300000)
    @Transactional
    public void retryFailedEmails() {
        List<EmailDeliveryLog> failedEmails = emailDeliveryLogRepository
                .findByStatusAndRetryCountLessThan(STATUS_FAILED, MAX_RETRIES);

        if (failedEmails.isEmpty()) {
            log.debug("No failed emails to retry.");
            return;
        }

        log.info("Retrying {} failed email(s)...", failedEmails.size());

        for (EmailDeliveryLog emailLog : failedEmails) {
            try {
                emailLog.setStatus(STATUS_RETRYING);
                emailDeliveryLogRepository.save(emailLog);

                emailService.resendByLog(
                    emailLog.getRecipientEmail(),
                    emailLog.getSubject(),
                    emailLog.getTemplateName());

                emailLog.setStatus(STATUS_SENT);
                emailLog.setFailureReason(null);
                emailDeliveryLogRepository.save(emailLog);

                log.info("Email retry succeeded: id=[{}] recipient=[{}] attempt=[{}]",
                    emailLog.getId(), emailLog.getRecipientEmail(), emailLog.getRetryCount() + 1);

            } catch (Exception ex) {
                emailLog.setStatus(STATUS_FAILED);
                emailLog.setRetryCount(emailLog.getRetryCount() + 1);
                emailLog.setFailureReason("Retry failed: " + ex.getMessage());
                emailDeliveryLogRepository.save(emailLog);

                log.error("Email retry failed: id=[{}] recipient=[{}] retryCount=[{}] error=[{}]",
                        emailLog.getId(), emailLog.getRecipientEmail(), emailLog.getRetryCount(), ex.getMessage());
            }
        }
    }
}
