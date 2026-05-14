package com.templeregistry.service.notification;

import org.junit.jupiter.api.Test;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import static org.assertj.core.api.Assertions.assertThat;

class PasswordResetEmailTemplateRenderTest {

    @Test
    void should_renderPasswordResetTemplate_when_requiredVariablesProvided() {
        SpringTemplateEngine engine = new SpringTemplateEngine();
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode("HTML");
        resolver.setCharacterEncoding("UTF-8");
        resolver.setCacheable(false);
        engine.setTemplateResolver(resolver);

        Context context = new Context();
        context.setVariable("resetLink", "https://staging.templeregistry.gov.in/reset-password?token=testToken123");
        context.setVariable("expiryMinutes", 30);

        String html = engine.process("email/password-reset", context);

        assertThat(html).contains("Temple Registry Password Reset");
        assertThat(html).contains("https://staging.templeregistry.gov.in/reset-password?token=testToken123");
        assertThat(html).contains("30");
        assertThat(html).contains("<html");
        assertThat(html).contains("</html>");
    }
}
