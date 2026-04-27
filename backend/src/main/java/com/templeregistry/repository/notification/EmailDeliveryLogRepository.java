package com.templeregistry.repository.notification;

import com.templeregistry.entity.notification.EmailDeliveryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for {@link EmailDeliveryLog}.
 */
@Repository
public interface EmailDeliveryLogRepository extends JpaRepository<EmailDeliveryLog, Long> {

    /**
     * Find all email delivery logs for a specific notification event.
     */
    List<EmailDeliveryLog> findByNotificationEventId(Long notificationEventId);

    /**
     * Find all email delivery logs for a specific recipient.
     */
    List<EmailDeliveryLog> findByRecipientEmailOrderBySentAtDesc(String recipientEmail);

    /**
     * Find all failed email deliveries.
     */
    List<EmailDeliveryLog> findByStatus(String status);

    /**
     * Find failed emails that can be retried (retry count below threshold).
     */
    List<EmailDeliveryLog> findByStatusAndRetryCountLessThan(String status, int maxRetries);

    /**
     * Find emails sent within a date range.
     */
    List<EmailDeliveryLog> findBySentAtBetween(LocalDateTime startDate, LocalDateTime endDate);
}
