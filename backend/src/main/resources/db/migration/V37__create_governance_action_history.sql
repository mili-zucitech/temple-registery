-- V37: Create governance_action_history table (or fix if already exists)
-- ─────────────────────────────────────────────
-- Append-only audit log for all DC governance actions:
-- VERIFY, FLAG, APPROVE, REJECT, SEND_BACK, QUERY, UNDER_REVIEW, etc.
-- Used by GovernanceAuditService.logAction() across all governed modules.

CREATE TABLE IF NOT EXISTS governance_action_history (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    entity_id   BIGINT       NOT NULL,
    entity_type VARCHAR(64)  NOT NULL COMMENT 'e.g. TEMPLE, TRUST, DECLARATION',
    dc_user_id  BIGINT       NOT NULL,
    action      VARCHAR(64)  NOT NULL COMMENT 'e.g. VERIFY, FLAG, APPROVE, REJECT, SEND_BACK',
    comment     TEXT,
    timestamp   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    INDEX idx_gov_action_entity   (entity_type, entity_id),
    INDEX idx_gov_action_dc_user  (dc_user_id),
    INDEX idx_gov_action_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Drop governance_version column if it exists (leftover from old entity version)
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'governance_action_history'
      AND COLUMN_NAME = 'governance_version'
);
SET @sql = IF(@col_exists > 0,
    'ALTER TABLE governance_action_history DROP COLUMN governance_version',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
