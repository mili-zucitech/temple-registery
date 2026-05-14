package com.templeregistry.service.impl.notification;

import com.templeregistry.entity.notification.EmailDeliveryLog;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.repository.notification.EmailDeliveryLogRepository;
import com.templeregistry.service.notification.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDateTime;

/**
 * Implementation of {@link EmailService}.
 * Sends email notifications using JavaMailSender and Thymeleaf templates.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final EmailDeliveryLogRepository deliveryLogRepository;
    private final com.templeregistry.repository.auth.UserRepository userRepository;

    @Value("${spring.mail.from:noreply@templeregistry.gov.in}")
    private String fromEmail;

    @Value("${app.base-url}")
    private String baseUrl;

    @Value("${spring.mail.enabled:false}")
    private boolean emailEnabled;

    @Override
    @Async("taskExecutor")
    public void sendNotificationEmail(String recipientEmail, BaseNotificationEvent event, Long notificationEventId) {
        if (!emailEnabled) {
            log.debug("Email sending is disabled. Skipping email to {}", recipientEmail);
            return;
        }

        String templateName = determineTemplateName(event);
        String subject = event.getNotificationTitle();

        try {
            // Prepare template context
            Context context = new Context();
            context.setVariable("title", event.getNotificationTitle());
            context.setVariable("body", event.getNotificationBody());
            context.setVariable("actionUrl", baseUrl + event.getActionUrl());
            context.setVariable("priority", event.getPriority().name());
            context.setVariable("category", event.getCategory().name());
            context.setVariable("year", LocalDateTime.now().getYear());

            // Render email template
            String htmlContent = templateEngine.process(templateName, context);

            // Send email
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(recipientEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);

            // Log successful delivery
            logEmailDelivery(notificationEventId, recipientEmail, subject, templateName, "SENT", null);

            log.info("Email sent successfully: recipient=[{}] subject=[{}]", recipientEmail, subject);

        } catch (MessagingException ex) {
            log.error("Failed to send email: recipient=[{}] subject=[{}]", recipientEmail, subject, ex);
            logEmailDelivery(notificationEventId, recipientEmail, subject, templateName, "FAILED", ex.getMessage());
        } catch (Exception ex) {
            log.error("Unexpected error sending email: recipient=[{}]", recipientEmail, ex);
            logEmailDelivery(notificationEventId, recipientEmail, subject, templateName, "FAILED", ex.getMessage());
        }
    }

    @Override
    public void sendTestEmail(String recipientEmail) {
        if (!emailEnabled) {
            log.warn("Email sending is disabled. Cannot send test email.");
            return;
        }

        try {
            Context context = new Context();
            context.setVariable("title", "Test Email");
            context.setVariable("body", "This is a test email from Temple Registry System.");
            context.setVariable("actionUrl", baseUrl);
            context.setVariable("priority", "LOW");
            context.setVariable("category", "SYSTEM");
            context.setVariable("year", LocalDateTime.now().getYear());

            String htmlContent = templateEngine.process("email/notification", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(recipientEmail);
            helper.setSubject("Test Email - Temple Registry System");
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Test email sent successfully to: {}", recipientEmail);

        } catch (Exception ex) {
            log.error("Failed to send test email to: {}", recipientEmail, ex);
            throw new RuntimeException("Failed to send test email", ex);
        }
    }

    /**
     * v2 pipeline: look up user email by recipientId, then send templated email.
     * Implements the default no-op from EmailService interface.
     */
    @Override
    @org.springframework.scheduling.annotation.Async("taskExecutor")
    public void sendNotification(Long recipientId, String subject, String templateKey,
                                  java.util.Map<String, Object> metadata) {
        if (!emailEnabled) {
            log.debug("[EmailService v2] Email disabled — skip send to userId={}", recipientId);
            return;
        }
        if (recipientId == null) {
            log.warn("[EmailService v2] recipientId is null — skipping");
            return;
        }
        String recipientEmail = userRepository.findById(recipientId)
            .map(com.templeregistry.entity.auth.User::getEmail)
            .orElse(null);
        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.warn("[EmailService v2] No email found for userId={} — skipping", recipientId);
            return;
        }
        try {
            Context context = new Context();
            context.setVariable("title", subject);
            context.setVariable("year", LocalDateTime.now().getYear());
            context.setVariable("actionUrl", baseUrl);
            if (metadata != null) metadata.forEach(context::setVariable);

            String template = (templateKey != null && !templateKey.isBlank()) ? templateKey : "email/notification";
            String htmlContent = templateEngine.process(template, context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(recipientEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);

            logEmailDelivery(null, recipientEmail, subject, template, "SENT", null);
            log.info("[EmailService v2] Sent to userId={} email=[{}]", recipientId, recipientEmail);
        } catch (jakarta.mail.MessagingException ex) {
            log.error("[EmailService v2] MessagingException for userId={}", recipientId, ex);
            logEmailDelivery(null, recipientEmail, subject, templateKey, "FAILED", ex.getMessage());
        } catch (Exception ex) {
            log.error("[EmailService v2] Unexpected error for userId={}", recipientId, ex);
            logEmailDelivery(null, recipientEmail, subject, templateKey, "FAILED", ex.getMessage());
        }
    }

    /**
     * Retry delivery using data stored in an existing {@link EmailDeliveryLog} row.
     * Called by {@link com.templeregistry.service.notification.EmailRetryScheduler}.
     * Does NOT log a new delivery row — the scheduler updates the existing log.
     */
    @Override
    public void resendByLog(String recipientEmail, String subject, String templateName)
            throws jakarta.mail.MessagingException {
        Context context = new Context();
        context.setVariable("title", subject);
        context.setVariable("year", LocalDateTime.now().getYear());
        context.setVariable("actionUrl", baseUrl);

        String template = (templateName != null && !templateName.isBlank()) ? templateName : "email/notification";
        String htmlContent = templateEngine.process(template, context);

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(fromEmail);
        helper.setTo(recipientEmail);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        mailSender.send(message);
    }

    /**
     * Sends a password-reset email with a one-time link.
     * Implements {@link com.templeregistry.service.notification.EmailService#sendPasswordResetEmail}.
     */
    @Override
    @org.springframework.scheduling.annotation.Async("taskExecutor")
    public void sendPasswordResetEmail(String recipientEmail, String resetLink) {
        if (!emailEnabled) {
            log.info("[PasswordReset] Email disabled — reset link generated for [{}] (link omitted from logs)", recipientEmail);
            return;
        }
        try {
            Context context = new Context();
            context.setVariable("title", "Password Reset Request");
            context.setVariable("resetLink", resetLink);
            context.setVariable("expiryMinutes", 30);
            context.setVariable("year", LocalDateTime.now().getYear());

            String htmlContent = templateEngine.process("email/password-reset", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(recipientEmail);
            helper.setSubject("Temple Registry — Password Reset");
            helper.setText(htmlContent, true);
            mailSender.send(message);

            logEmailDelivery(null, recipientEmail, "Temple Registry — Password Reset",
                    "email/password-reset", "SENT", null);
            log.info("[PasswordReset] Reset email sent to [{}]", recipientEmail);
        } catch (jakarta.mail.MessagingException ex) {
            log.error("[PasswordReset] Failed to send reset email to [{}]", recipientEmail, ex);
            logEmailDelivery(null, recipientEmail, "Temple Registry — Password Reset",
                    "email/password-reset", "FAILED", ex.getMessage());
        }
    }

    private void logEmailDelivery(
            Long notificationEventId,
            String recipientEmail,
            String subject,
            String templateName,
            String status,
            String failureReason) {
        try {
            EmailDeliveryLog log = EmailDeliveryLog.builder()
                    .notificationEventId(notificationEventId)
                    .recipientEmail(recipientEmail)
                    .subject(subject)
                    .templateName(templateName)
                    .status(status)
                    .sentAt("SENT".equals(status) ? LocalDateTime.now() : null)
                    .failureReason(failureReason)
                    .retryCount(0)
                    .build();

            deliveryLogRepository.save(log);
        } catch (Exception ex) {
            // Don't let logging failures break the main flow
            this.log.error("Failed to log email delivery: recipient=[{}]", recipientEmail, ex);
        }
    }

    /**
     * Determines the appropriate email template based on the event category.
     */
    private String determineTemplateName(BaseNotificationEvent event) {
        return switch (event.getCategory()) {
            case APPROVAL -> "email/approval-notification";
            case REJECTION -> "email/rejection-notification";
            case CLARIFICATION -> "email/clarification-notification";
            case SITE_VISIT -> "email/site-visit-notification";
            case SUBMISSION -> "email/submission-notification";
            default -> "email/notification";
        };
    }
}
