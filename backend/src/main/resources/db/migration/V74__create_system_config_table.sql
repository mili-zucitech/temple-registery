-- V70: Create system_config table for SUPER_ADMIN managed settings
--
-- Idempotency note: MySQL DDL is not transactional, so a previously failed
-- attempt of this migration may leave a partially-built (empty) system_config
-- table with corrupt index metadata (MySQL error 8140). We drop-and-recreate
-- unconditionally because:
--   a) If this is a fresh DB the table doesn't exist → DROP IF EXISTS is a no-op.
--   b) If this is a retry after a prior failure the table is guaranteed empty
--      (the INSERT below never completed) → drop is safe.
--   c) Flyway only runs V70 when it has no SUCCESS entry, so if V70 previously
--      succeeded this block is never reached.
--
-- All indexes are inlined in CREATE TABLE to avoid separate ADD INDEX steps
-- that cause "Duplicate key name" when the table already exists.

DROP TABLE IF EXISTS system_config;

CREATE TABLE system_config (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    config_key      VARCHAR(100) NOT NULL,
    config_value    VARCHAR(1000) NOT NULL,
    data_type       VARCHAR(20)  NOT NULL DEFAULT 'STRING',
    category        VARCHAR(30)  NOT NULL DEFAULT 'FEATURE',
    description     VARCHAR(500),
    is_active       TINYINT(1)   NOT NULL DEFAULT 1,
    is_deleted      TINYINT(1)   NOT NULL DEFAULT 0,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by      BIGINT       NOT NULL DEFAULT 0,
    updated_by      BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sc_key    (config_key),
    INDEX idx_sc_key        (config_key),
    INDEX idx_sc_category   (category),
    INDEX idx_sc_active     (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default SLA config values
INSERT IGNORE INTO system_config (config_key, config_value, data_type, category, description, created_by, updated_by) VALUES
('sla.declaration.review_days',       '30',    'INTEGER', 'SLA',          'Days DC has to review a submitted declaration before it is marked overdue', 0, 0),
('sla.temple_profile.review_days',    '14',    'INTEGER', 'SLA',          'Days DC has to review a temple profile staging submission', 0, 0),
('sla.clarification.response_days',   '7',     'INTEGER', 'SLA',          'Days TA has to respond to a clarification request', 0, 0),
('notification.email.enabled',        'true',  'BOOLEAN', 'NOTIFICATION', 'Global toggle to enable or disable email notifications', 0, 0),
('notification.inapp.enabled',        'true',  'BOOLEAN', 'NOTIFICATION', 'Global toggle to enable or disable in-app notifications', 0, 0),
('feature.evidence_pack.enabled',     'true',  'BOOLEAN', 'FEATURE',      'Enable evidence pack export for AUDITOR role', 0, 0),
('feature.observation.enabled',       'true',  'BOOLEAN', 'FEATURE',      'Enable observation creation by AUDITOR role', 0, 0);

-- Seed default SLA config values
INSERT IGNORE INTO system_config (config_key, config_value, data_type, category, description, created_by, updated_by) VALUES
('sla.declaration.review_days',       '30',    'INTEGER', 'SLA',          'Days DC has to review a submitted declaration before it is marked overdue', 0, 0),
('sla.temple_profile.review_days',    '14',    'INTEGER', 'SLA',          'Days DC has to review a temple profile staging submission', 0, 0),
('sla.clarification.response_days',   '7',     'INTEGER', 'SLA',          'Days TA has to respond to a clarification request', 0, 0),
('notification.email.enabled',        'true',  'BOOLEAN', 'NOTIFICATION', 'Global toggle to enable or disable email notifications', 0, 0),
('notification.inapp.enabled',        'true',  'BOOLEAN', 'NOTIFICATION', 'Global toggle to enable or disable in-app notifications', 0, 0),
('feature.evidence_pack.enabled',     'true',  'BOOLEAN', 'FEATURE',      'Enable evidence pack export for AUDITOR role', 0, 0),
('feature.observation.enabled',       'true',  'BOOLEAN', 'FEATURE',      'Enable observation creation by AUDITOR role', 0, 0);
