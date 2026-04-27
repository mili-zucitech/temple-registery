package com.templeregistry.service.notification;

import com.templeregistry.event.base.BaseNotificationEvent;

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
}
