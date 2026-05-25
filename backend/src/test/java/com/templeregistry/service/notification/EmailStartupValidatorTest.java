package com.templeregistry.service.notification;

import com.templeregistry.entity.notification.NotificationRule;
import com.templeregistry.repository.notification.NotificationRuleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.IContext;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailStartupValidatorTest {

    @Mock private NotificationRuleRepository notificationRuleRepository;
    @Mock private EmailTemplateResolver templateResolver;
    @Mock private TemplateEngine templateEngine;

    @InjectMocks
    private EmailStartupValidator validator;

    private NotificationRule emailRule(String action, String templateKey) {
        NotificationRule rule = new NotificationRule();
        rule.setId(1L);
        rule.setAction(action);
        rule.setTemplateKey(templateKey);
        rule.setChannel("EMAIL");
        return rule;
    }

    @Test
    void should_log_no_errors_when_all_templates_exist() {
        when(notificationRuleRepository.findByEnabledTrueAndDeletedFalse())
            .thenReturn(List.of(emailRule("SUBMIT", "submission-notification")));
        when(templateResolver.resolve("submission-notification"))
            .thenReturn("email/submission-notification");

        // Simulate successful template resolution for rule template and fixed templates
        when(templateEngine.process(any(String.class), any(IContext.class)))
            .thenReturn("<html>ok</html>");

        // Should not throw
        validator.onApplicationEvent(null);

        verify(templateEngine, atLeastOnce()).process(eq("email/submission-notification"), any());
    }

    @Test
    void should_skip_inapp_only_rules_when_validating_templates() {
        NotificationRule inAppRule = emailRule("APPROVE", "approval-notification");
        inAppRule.setChannel("IN_APP");

        when(notificationRuleRepository.findByEnabledTrueAndDeletedFalse())
            .thenReturn(List.of(inAppRule));
        when(templateEngine.process(any(String.class), any(IContext.class)))
            .thenReturn("<html>ok</html>");

        validator.onApplicationEvent(null);

        // templateResolver.resolve should NOT be called for IN_APP-only rules
        verifyNoInteractions(templateResolver);
    }

    @Test
    void should_log_error_but_not_throw_when_fail_fast_is_false_and_template_missing() throws Exception {
        // fail-fast defaults to false in @Value
        when(notificationRuleRepository.findByEnabledTrueAndDeletedFalse())
            .thenReturn(List.of(emailRule("SUBMIT", "submission-notification")));
        when(templateResolver.resolve("submission-notification"))
            .thenReturn("email/submission-notification");

        // Simulate template engine throwing for the rule template and fixed templates
        when(templateEngine.process(any(String.class), any(IContext.class)))
            .thenThrow(new RuntimeException("Template not found"));

        // Should not throw (fail-fast = false is the default)
        validator.onApplicationEvent(null);
    }

    @Test
    void should_process_both_channel_rules_for_email_templates() {
        NotificationRule bothRule = emailRule("REJECT", "rejection-notification");
        bothRule.setChannel("BOTH");

        when(notificationRuleRepository.findByEnabledTrueAndDeletedFalse())
            .thenReturn(List.of(bothRule));
        when(templateResolver.resolve("rejection-notification"))
            .thenReturn("email/rejection-notification");
        when(templateEngine.process(any(String.class), any(IContext.class)))
            .thenReturn("<html>ok</html>");

        validator.onApplicationEvent(null);

        verify(templateResolver).resolve("rejection-notification");
        verify(templateEngine, atLeastOnce()).process(eq("email/rejection-notification"), any());
    }
}
