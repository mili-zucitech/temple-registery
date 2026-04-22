package com.templeregistry.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Runs idempotent schema repairs at startup for columns that Hibernate's
 * ddl-auto:update may have missed (e.g. on TiDB Cloud with restricted DDL).
 *
 * Each ALTER is wrapped in an existence check so it is safe to run repeatedly.
 * Remove this class once Flyway is re-enabled and migrations are applied.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SchemaRepairRunner implements CommandLineRunner {

    private final JdbcTemplate jdbc;

    @Override
    public void run(String... args) {
        // asset_declarations — columns added by V35 that may be missing
        addColumnIfMissing("asset_declarations", "governance_version",          "BIGINT NOT NULL DEFAULT 1");
        addColumnIfMissing("asset_declarations", "submission_status",           "VARCHAR(20) NOT NULL DEFAULT 'DRAFT'");
        addColumnIfMissing("asset_declarations", "system_verification_status",  "VARCHAR(30) NULL");
        addColumnIfMissing("asset_declarations", "dc_decision_status",          "VARCHAR(30) NOT NULL DEFAULT 'PENDING_DC_APPROVAL'");
        addColumnIfMissing("asset_declarations", "send_back_reason",            "TEXT NULL");
        addColumnIfMissing("asset_declarations", "physical_verification_status","VARCHAR(50) NOT NULL DEFAULT 'NOT_INITIATED'");
        addColumnIfMissing("asset_declarations", "physical_verification_ordered_at",  "DATETIME(6) NULL");
        addColumnIfMissing("asset_declarations", "physical_verification_ordered_by",  "BIGINT NULL");
        addColumnIfMissing("asset_declarations", "physical_verification_completed_at","DATETIME(6) NULL");

        // trusts — columns added by V25/V35 that may be missing
        addColumnIfMissing("trusts", "governance_version",         "BIGINT NOT NULL DEFAULT 1");
        addColumnIfMissing("trusts", "submission_status",          "VARCHAR(20) NOT NULL DEFAULT 'DRAFT'");
        addColumnIfMissing("trusts", "system_verification_status", "VARCHAR(30) NULL");
        addColumnIfMissing("trusts", "dc_decision_status",         "VARCHAR(30) NOT NULL DEFAULT 'PENDING_DC_APPROVAL'");
        addColumnIfMissing("trusts", "send_back_reason",           "TEXT NULL");
        addColumnIfMissing("trusts", "is_verified_by_dc",          "TINYINT(1) NOT NULL DEFAULT 0");
        addColumnIfMissing("trusts", "dc_flag_reason",             "MEDIUMTEXT NULL");

        // governance_action_history — legacy column
        addColumnIfMissing("governance_action_history", "governance_version", "BIGINT NOT NULL DEFAULT 1");

        log.info("SchemaRepairRunner: schema checks complete.");
    }

    private void addColumnIfMissing(String table, String column, String definition) {
        try {
            Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM information_schema.COLUMNS " +
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                Integer.class, table, column);
            if (count == null || count == 0) {
                jdbc.execute("ALTER TABLE `" + table + "` ADD COLUMN `" + column + "` " + definition);
                log.info("SchemaRepairRunner: added column {}.{}", table, column);
            } else {
                log.debug("SchemaRepairRunner: column {}.{} already exists, skipping.", table, column);
            }
        } catch (Exception e) {
            log.warn("SchemaRepairRunner: could not check/add column {}.{}: {}", table, column, e.getMessage());
        }
    }
}
