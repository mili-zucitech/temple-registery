-- ============================================================
-- V40: Create Governance Action History Table
-- Tracks DC governance actions on entities
-- ============================================================

CREATE TABLE IF NOT EXISTS governance_action_history (
    id                      BIGINT         NOT NULL AUTO_INCREMENT,
    entity_id               BIGINT         NOT NULL COMMENT 'ID of the entity being acted upon',
    entity_type             VARCHAR(64)    NOT NULL COMMENT 'Type: TEMPLE, TRUST, EMPLOYEE, CONTRACTOR, DECLARATION',
    dc_user_id              BIGINT         NOT NULL COMMENT 'DC user who performed the action',
    action                  VARCHAR(64)    NOT NULL COMMENT 'Action: VERIFY, FLAG, QUERY, APPROVE, REJECT, UNDER_REVIEW',
    comment                 TEXT           NULL COMMENT 'Optional comment or reason',
    governance_version      INT            NOT NULL DEFAULT 1 COMMENT 'Version counter for optimistic locking',
    timestamp               DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the action occurred',
    PRIMARY KEY (id),
    INDEX idx_gov_action_entity (entity_type, entity_id),
    INDEX idx_gov_action_dc_user (dc_user_id),
    INDEX idx_gov_action_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks governance actions performed by DC users on various entities';
