package com.templeregistry.service.notification;

import com.templeregistry.event.base.BaseNotificationEvent;

import java.util.Map;

/**
 * Service for sending email notifications.
 * Handles email template rendering and SMTP delivery.
 */
public interface EmailService {

    /**
     * Sends an email notification based on the given event.
     * Uses Thymeleaf templates for email rendering.
     *
     * @param recipientEmail the recipient's email address
     * @param event the notification event containing email data
     * @param notificationEventId the ID of the notification event for audit logging
     */
    void sendNotificationEmail(String recipientEmail, BaseNotificationEvent event, Long notificationEventId);

    /**
     * Sends a test email to verify SMTP configuration.
     *
     * @param recipientEmail the recipient's email address
     */
    void sendTestEmail(String recipientEmail);

    /**
     * Convenience overload used by NotificationDispatchService (v2 pipeline).
     * Looks up recipient's email by userId and sends a templated notification.
     * Default implementation is a no-op — override in EmailServiceImpl.
     *
     * @param recipientId  User ID (email looked up from user table)
     * @param subject      Email subject line
     * @param templateKey  Thymeleaf template key
     * @param metadata     Template variables map
     */
    default void sendNotification(Long recipientId, String subject, String templateKey,
                                   Map<String, Object> metadata) {
        // No-op default — override in EmailServiceImpl to enable email delivery
        // for the new notification router pipeline
    }

    /**
     * Sends a password-reset email containing a one-time link to the given address.
     *
     * @param recipientEmail the user's email address
     * @param resetLink      the full reset URL including the raw token as a query param
     */
    default void sendPasswordResetEmail(String recipientEmail, String resetLink) {
        // No-op default — override in EmailServiceImpl for SMTP delivery
    }

    /**
     * Resends an email using the recipient address, subject and template already
     * stored in a failed {@link com.templeregistry.entity.notification.EmailDeliveryLog} row.
     * Called by {@link com.templeregistry.service.notification.EmailRetryScheduler}.
     *
     * @param recipientEmail email address from the delivery log
     * @param subject        subject line from the delivery log
     * @param templateName   Thymeleaf template key from the delivery log
     * @throws jakarta.mail.MessagingException if SMTP delivery fails
     */
    default void resendByLog(String recipientEmail, String subject, String templateName)
            throws jakarta.mail.MessagingException {
        // No-op default — overridden in EmailServiceImpl
    }
}
