package com.templeregistry.config;

import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configures Flyway migration strategy.
 *
 * Auto-repair is ONLY enabled in dev/test profiles via the
 * {@code app.flyway.auto-repair} property (default: false).
 * In production, a failed migration must be investigated manually —
 * auto-repair can silently mask schema integrity issues.
 *
 * To enable repair in dev, set {@code app.flyway.auto-repair=true}
 * in application-dev.yml (already done).
 */
@Configuration
@Slf4j
public class FlywayConfig {

    @Value("${app.flyway.auto-repair:false}")
    private boolean autoRepair;

    @Bean
    public FlywayMigrationStrategy repairThenMigrate() {
        return flyway -> {
            if (autoRepair) {
                log.warn("[FlywayConfig] Auto-repair is ENABLED — only safe in dev/test environments.");
                flyway.repair();
            }
            flyway.migrate();
        };
    }
}
