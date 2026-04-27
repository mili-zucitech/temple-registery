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

    @Value("${spring.mail.from:noreply@templeregistry.gov.in}")
    private String fromEmail;

    @Value("${app.base-url:http://localhost:3000}")
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
