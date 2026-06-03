-- ============================================================================
-- V10: Dynamic Access Control & Visibility Management (DACVM) tables
-- Adds policy engine tables on top of the existing @PreAuthorize layer.
-- These tables are additive: zero changes to existing schema.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- access_control_policies
-- Stores SA-defined ALLOW/DENY policies at role-level or user-level for a
-- given UI/API target key (e.g. 'button.ta.employees.add').
-- Explicit DENY always wins over ALLOW. If no policy row exists, default is
-- ALLOW (existing @PreAuthorize structural permissions are the floor).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS access_control_policies (
    id             BIGINT        NOT NULL AUTO_INCREMENT,
    target_type    VARCHAR(30)   NOT NULL COMMENT 'PAGE|TAB|SECTION|BUTTON|FIELD|REPORT|API_ENDPOINT',
    target_key     VARCHAR(255)  NOT NULL COMMENT 'Namespaced key, e.g. button.ta.employees.add',
    subject_type   VARCHAR(10)   NOT NULL COMMENT 'ROLE|USER',
    subject_value  VARCHAR(100)  NOT NULL COMMENT 'Role name (e.g. TEMPLE_AUTHORITY) or user ID as string',
    effect         VARCHAR(10)   NOT NULL DEFAULT 'ALLOW' COMMENT 'ALLOW|DENY',
    is_active      TINYINT(1)   NOT NULL DEFAULT 1,
    conditions     JSON          NULL COMMENT 'Reserved for future contextual rule expressions',
    is_deleted     TINYINT(1)   NOT NULL DEFAULT 0,
    created_at     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by     BIGINT       NOT NULL DEFAULT 0,
    updated_by     BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_acp_target_subject (target_key, subject_type, subject_value),
    INDEX idx_acp_target_key  (target_key),
    INDEX idx_acp_subject     (subject_type, subject_value),
    INDEX idx_acp_active      (is_active),
    INDEX idx_acp_deleted     (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Dynamic policy overrides managed by SUPER_ADMIN';

-- ----------------------------------------------------------------------------
-- access_control_field_masks
-- Controls which fields are masked for a given role or user.
-- mask_pattern: e.g. '****' or 'XXXX-XXXX-####'
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS access_control_field_masks (
    id             BIGINT        NOT NULL AUTO_INCREMENT,
    field_key      VARCHAR(255)  NOT NULL COMMENT 'e.g. field.temple.bank_account',
    subject_type   VARCHAR(10)   NOT NULL COMMENT 'ROLE|USER',
    subject_value  VARCHAR(100)  NOT NULL COMMENT 'Role name or user ID string',
    mask_enabled   TINYINT(1)   NOT NULL DEFAULT 1,
    mask_pattern   VARCHAR(50)   NOT NULL DEFAULT '****',
    is_active      TINYINT(1)   NOT NULL DEFAULT 1,
    is_deleted     TINYINT(1)   NOT NULL DEFAULT 0,
    created_at     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by     BIGINT       NOT NULL DEFAULT 0,
    updated_by     BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_acfm_field_subject (field_key, subject_type, subject_value),
    INDEX idx_acfm_field_key  (field_key),
    INDEX idx_acfm_subject    (subject_type, subject_value),
    INDEX idx_acfm_deleted    (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Field-level masking configuration managed by SUPER_ADMIN';

-- ----------------------------------------------------------------------------
-- access_control_audit_log
-- Immutable log of every policy or field-mask change made by SA.
-- No soft-delete: this table is append-only for compliance.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS access_control_audit_log (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    policy_id           BIGINT        NULL COMMENT 'FK to access_control_policies (nullable for field mask changes)',
    field_mask_id       BIGINT        NULL COMMENT 'FK to access_control_field_masks (nullable for policy changes)',
    changed_by_user_id  BIGINT        NOT NULL,
    change_type         VARCHAR(20)   NOT NULL COMMENT 'CREATE|UPDATE|DELETE|ACTIVATE|DEACTIVATE',
    old_value           JSON          NULL,
    new_value           JSON          NULL,
    changed_at          DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ip_address          VARCHAR(50)   NULL,
    is_deleted          TINYINT(1)   NOT NULL DEFAULT 0,
    created_at          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by          BIGINT       NOT NULL DEFAULT 0,
    updated_by          BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_acal_policy_id   (policy_id),
    INDEX idx_acal_changed_by  (changed_by_user_id),
    INDEX idx_acal_changed_at  (changed_at),
    INDEX idx_acal_change_type (change_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Immutable audit trail for DACVM policy changes';

-- ----------------------------------------------------------------------------
-- Seed: pre-register all known target keys with default ALLOW for SA.
-- This lets the admin UI display the full catalog even before any policies
-- are explicitly set. All entries are ALLOW by default — no behavior change.
-- SA is never subject to DENY policies (enforced in PolicyEvaluationServiceImpl).
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO access_control_policies
    (target_type, target_key, subject_type, subject_value, effect, is_active, created_by, updated_by)
VALUES
    -- Pages
    ('PAGE', 'page.dc.export',                'ROLE', 'DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    ('PAGE', 'page.dc.export',                'ROLE', 'DC_STAFF',           'ALLOW', 1, 0, 0),
    ('PAGE', 'page.dc.activity',              'ROLE', 'DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    ('PAGE', 'page.dc.activity',              'ROLE', 'DC_STAFF',           'ALLOW', 1, 0, 0),
    ('PAGE', 'page.auditor.compliance',       'ROLE', 'AUDITOR',            'ALLOW', 1, 0, 0),
    ('PAGE', 'page.viewer.export',            'ROLE', 'VIEWER',             'ALLOW', 1, 0, 0),
    ('PAGE', 'page.admin.tools',              'ROLE', 'SUPER_ADMIN',        'ALLOW', 1, 0, 0),
    -- Buttons / Actions
    ('BUTTON', 'button.ta.employees.add',     'ROLE', 'TEMPLE_AUTHORITY',   'ALLOW', 1, 0, 0),
    ('BUTTON', 'button.ta.contractors.new',   'ROLE', 'TEMPLE_AUTHORITY',   'ALLOW', 1, 0, 0),
    ('BUTTON', 'button.ta.documents.upload',  'ROLE', 'TEMPLE_AUTHORITY',   'ALLOW', 1, 0, 0),
    ('BUTTON', 'button.ta.declaration.new',   'ROLE', 'TEMPLE_AUTHORITY',   'ALLOW', 1, 0, 0),
    ('BUTTON', 'button.ta.declaration.withdraw','ROLE','TEMPLE_AUTHORITY',  'ALLOW', 1, 0, 0),
    ('BUTTON', 'button.dc.declaration.approve','ROLE','DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    ('BUTTON', 'button.dc.declaration.reject', 'ROLE','DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    ('BUTTON', 'button.dc.temple.flag',        'ROLE','DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    ('BUTTON', 'button.dc.temple.verify',      'ROLE','DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    -- Tabs / Sections
    ('TAB', 'tab.dc.temple.trust',            'ROLE', 'DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.trust',            'ROLE', 'DC_STAFF',           'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.declarations',     'ROLE', 'DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.declarations',     'ROLE', 'DC_STAFF',           'ALLOW', 1, 0, 0),
    -- Reports / Exports
    ('REPORT', 'report.dc.export.temples',    'ROLE', 'DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    ('REPORT', 'report.dc.export.temples',    'ROLE', 'DC_STAFF',           'ALLOW', 1, 0, 0),
    ('REPORT', 'report.dc.export.declarations','ROLE','DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    ('REPORT', 'report.dc.export.declarations','ROLE','DC_STAFF',           'ALLOW', 1, 0, 0),
    ('REPORT', 'report.auditor.evidence_pack','ROLE', 'AUDITOR',            'ALLOW', 1, 0, 0),
    -- Sensitive Fields
    ('FIELD', 'field.temple.bank_account',    'ROLE', 'DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    ('FIELD', 'field.temple.bank_account',    'ROLE', 'DC_STAFF',           'ALLOW', 1, 0, 0),
    ('FIELD', 'field.temple.bank_account',    'ROLE', 'AUDITOR',            'ALLOW', 1, 0, 0),
    ('FIELD', 'field.user.mobile',            'ROLE', 'DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    ('FIELD', 'field.user.mobile',            'ROLE', 'AUDITOR',            'ALLOW', 1, 0, 0);
