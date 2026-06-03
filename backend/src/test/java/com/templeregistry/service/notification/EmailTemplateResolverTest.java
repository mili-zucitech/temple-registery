package com.templeregistry.service.notification;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EmailTemplateResolverTest {

    private EmailTemplateResolver resolver;

    @BeforeEach
    void setUp() {
        resolver = new EmailTemplateResolver();
    }

    @Test
    void should_prefix_email_when_key_has_no_prefix() {
        assertThat(resolver.resolve("submission-notification"))
            .isEqualTo("email/submission-notification");
    }

    @Test
    void should_not_double_prefix_when_key_already_starts_with_email_slash() {
        assertThat(resolver.resolve("email/submission-notification"))
            .isEqualTo("email/submission-notification");
    }

    @Test
    void should_return_fallback_when_key_is_null() {
        assertThat(resolver.resolve(null))
            .isEqualTo("email/notification");
    }

    @Test
    void should_return_fallback_when_key_is_blank() {
        assertThat(resolver.resolve("   "))
            .isEqualTo("email/notification");
    }

    @Test
    void should_prefix_all_known_workflow_template_keys() {
        String[] keys = {
            "submission-notification",
            "approval-notification",
            "rejection-notification",
            "clarification-request",
            "clarification-response",
            "resubmission-notification",
            "overdue-notification",
            "password-reset",
            "account-created"
        };
        for (String key : keys) {
            String resolved = resolver.resolve(key);
            assertThat(resolved).startsWith("email/");
            assertThat(resolved).isEqualTo("email/" + key);
        }
    }

    @Test
    void should_handle_key_with_leading_trailing_whitespace() {
        // isBlank() returns true for whitespace-only; non-blank whitespace-padded keys
        // will just get the prefix prepended (Thymeleaf will fail — that is expected / tested elsewhere)
        String resolved = resolver.resolve("  approval-notification  ");
        assertThat(resolved).startsWith("email/");
    }

    @Test
    void should_preserve_sub_path_when_already_prefixed() {
        assertThat(resolver.resolve("email/some/deep/template"))
            .isEqualTo("email/some/deep/template");
    }
}
