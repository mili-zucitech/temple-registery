package com.templeregistry.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Temporary fix for governance_version column issue.
 * This component runs on application startup and removes the problematic column.
 * 
 * TODO: Remove this class after the issue is fixed in all environments.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSchemaFix {

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void fixGovernanceVersionColumn() {
        try {
            log.info("Running database schema fixes...");
            
            // Fix 1: Remove governance_version from asset_declarations
            fixAssetDeclarationsGovernanceVersion();
            
            // Fix 2: Remove created_at from all declaration sub-tables
            fixDeclarationSubTablesCreatedAt();
            
            log.info("Database schema fixes completed successfully");
            
        } catch (Exception e) {
            log.error("Failed to apply database schema fixes. You may need to fix them manually.", e);
        }
    }
    
    private void fixAssetDeclarationsGovernanceVersion() {
        try {
            log.info("Checking for governance_version column in asset_declarations table...");
            
            String checkSql = """
                SELECT COUNT(*) 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'asset_declarations' 
                  AND COLUMN_NAME = 'governance_version'
                """;
            
            Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class);
            
            if (count != null && count > 0) {
                log.warn("Found governance_version column in asset_declarations. Removing it...");
                jdbcTemplate.execute("ALTER TABLE asset_declarations DROP COLUMN governance_version");
                log.info("Successfully removed governance_version column from asset_declarations");
            } else {
                log.info("No governance_version column found in asset_declarations. Schema is correct.");
            }
            
        } catch (Exception e) {
            log.error("Failed to fix governance_version column.", e);
            log.error("Run this SQL manually: ALTER TABLE asset_declarations DROP COLUMN IF EXISTS governance_version;");
        }
    }
    
    private void fixDeclarationSubTablesCreatedAt() {
        String[] tables = {
            "decl_immov_agri_land",
            "decl_immov_building",
            "decl_immov_leased",
            "decl_immov_other",
            "decl_mov_precious_metal",
            "decl_mov_artifact",
            "decl_mov_vehicle",
            "decl_mov_equipment",
            "decl_mov_financial"
        };
        
        String[] auditColumns = {"created_at", "created_by", "updated_at", "updated_by", "is_deleted"};
        
        for (String tableName : tables) {
            for (String columnName : auditColumns) {
                try {
                    String checkSql = """
                        SELECT COUNT(*) 
                        FROM INFORMATION_SCHEMA.COLUMNS 
                        WHERE TABLE_SCHEMA = DATABASE() 
                          AND TABLE_NAME = ? 
                          AND COLUMN_NAME = ?
                        """;
                    
                    Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, tableName, columnName);
                    
                    if (count != null && count > 0) {
                        log.warn("Found {} column in {}. Removing it...", columnName, tableName);
                        jdbcTemplate.execute("ALTER TABLE " + tableName + " DROP COLUMN " + columnName);
                        log.info("Successfully removed {} column from {}", columnName, tableName);
                    }
                    
                } catch (Exception e) {
                    log.error("Failed to fix {} column in {}.", columnName, tableName, e);
                }
            }
        }
    }
}
