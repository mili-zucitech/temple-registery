package com.templeregistry.service.impl.notification;

import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.notification.EmailDeliveryLogRepository;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.lang.reflect.Field;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailServiceImplPasswordResetTest {

    @Mock
    private org.springframework.mail.javamail.JavaMailSender mailSender;

    @Mock
    private TemplateEngine templateEngine;

    @Mock
    private EmailDeliveryLogRepository deliveryLogRepository;

    @Mock
    private UserRepository userRepository;

    private EmailServiceImpl emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailServiceImpl(mailSender, templateEngine, deliveryLogRepository, userRepository);
        setField(emailService, "fromEmail", "noreply@templeregistry.gov.in");
        setField(emailService, "emailEnabled", true);
    }

    @Test
    void should_sendPasswordResetEmail_when_emailEnabledAndTemplateRenders() {
        MimeMessage mimeMessage = new MimeMessage((Session) null);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("email/password-reset"), any(Context.class)))
                .thenReturn("<html><body>Password reset mock body</body></html>");

        emailService.sendPasswordResetEmail(
                "ta@example.com",
                "https://staging.templeregistry.gov.in/reset-password?token=abc123"
        );

        ArgumentCaptor<Context> contextCaptor = ArgumentCaptor.forClass(Context.class);
        verify(templateEngine).process(eq("email/password-reset"), contextCaptor.capture());
        verify(mailSender).send(any(MimeMessage.class));

        Context context = contextCaptor.getValue();
        assertThat(context.getVariable("resetLink"))
                .isEqualTo("https://staging.templeregistry.gov.in/reset-password?token=abc123");
        assertThat(context.getVariable("expiryMinutes")).isEqualTo(30);
    }

    private static void setField(Object target, String fieldName, Object value) {
        try {
            Field field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to set field: " + fieldName, ex);
        }
    }
}
