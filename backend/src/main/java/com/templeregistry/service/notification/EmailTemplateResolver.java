package com.templeregistry.service.notification;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Centralised email template key resolver.
 *
 * <p>All {@code template_key} values in {@code notification_rules} are short keys such as
 * {@code "submission-notification"}. Thymeleaf's ClassPath resolver uses the prefix
 * {@code classpath:/templates/} + suffix {@code .html}, so the full resolved path must be
 * {@code email/submission-notification} → {@code classpath:/templates/email/submission-notification.html}.
 *
 * <p>This class ensures every caller always gets the correct, fully-qualified template path
 * regardless of whether the raw key already contains the {@code "email/"} prefix or not.
 */
@Component
@Slf4j
public class EmailTemplateResolver {

    private static final String EMAIL_PREFIX   = "email/";
    private static final String FALLBACK_KEY   = "email/notification";

    /**
     * Resolve a short template key to its full Thymeleaf-resolvable path.
     *
     * <ul>
     *   <li>{@code "submission-notification"} → {@code "email/submission-notification"}</li>
     *   <li>{@code "email/notification"}       → {@code "email/notification"} (unchanged)</li>
     *   <li>{@code null} / blank               → {@code "email/notification"} (fallback)</li>
     * </ul>
     */
    public String resolve(String templateKey) {
        if (templateKey == null || templateKey.isBlank()) {
            log.warn("[TemplateResolver] Null/blank template key — using fallback: {}", FALLBACK_KEY);
            return FALLBACK_KEY;
        }
        if (templateKey.startsWith(EMAIL_PREFIX)) {
            return templateKey;
        }
        return EMAIL_PREFIX + templateKey;
    }

    /**
     * Convenience: resolve and return the fallback if the resolved key equals a known-broken value.
     */
    public String resolveOrFallback(String templateKey) {
        String resolved = resolve(templateKey);
        return resolved.isBlank() ? FALLBACK_KEY : resolved;
    }
}
