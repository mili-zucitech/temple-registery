-- ============================================================
-- V37: Merged migration (resolves duplicate V37 conflict)
--   1. V37__create_governance_action_history.sql
--   2. V37__rename_contractor_company_name_to_name.sql
-- ============================================================

-- ═════════════════════════════════════════════════════════════
-- Part 1: Create governance_action_history table
-- ═════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS governance_action_history (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    entity_id   BIGINT       NOT NULL,
    entity_type VARCHAR(64)  NOT NULL,
    dc_user_id  BIGINT       NOT NULL,
    action      VARCHAR(64)  NOT NULL,
    comment     TEXT,
    timestamp   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    INDEX idx_gov_action_entity   (entity_type, entity_id),
    INDEX idx_gov_action_dc_user  (dc_user_id),
    INDEX idx_gov_action_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═════════════════════════════════════════════════════════════
-- Part 2: Rename contractor company_name to name
-- ═════════════════════════════════════════════════════════════

ALTER TABLE contractors 
CHANGE COLUMN company_name name VARCHAR(255) NOT NULL;
