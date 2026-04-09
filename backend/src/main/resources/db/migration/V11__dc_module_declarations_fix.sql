-- ============================================================
-- V11: DC Module Pre-Implementation — Declaration Schema Fixes
-- dc_e2e F4 (lock_version rename), F2 (status data migration),
-- and missing asset_declaration / declaration_clarification fields.
-- ============================================================

-- -------------------------------------------------------
-- F4: Rename optimistic-lock column version → lock_version
-- (dc_e2e Section 2.1 F11 — avoids collision with version_number)
-- -------------------------------------------------------
ALTER TABLE asset_declarations
    RENAME COLUMN version TO lock_version;

-- -------------------------------------------------------
-- F2: Data migration — SUBMITTED becomes PENDING_REVIEW
-- The Java enum value SUBMITTED has been renamed to PENDING_REVIEW.
-- Existing rows with status='SUBMITTED' must be updated before the
-- application restarts with the new enum definition, otherwise JPA
-- will throw IllegalArgumentException on read.
-- -------------------------------------------------------
UPDATE asset_declarations
SET status = 'PENDING_REVIEW'
WHERE status = 'SUBMITTED';

-- -------------------------------------------------------
-- Add missing columns required by dc_e2e Section 4.8
-- All new columns are nullable or have safe defaults so existing
-- rows are unaffected.
-- -------------------------------------------------------
ALTER TABLE asset_declarations
    ADD COLUMN financial_year              CHAR(7)          NULL             COMMENT 'Financial year YYYY-YY e.g. 2025-26',
    ADD COLUMN version_number              INT UNSIGNED     NOT NULL DEFAULT 1 COMMENT 'Submission counter per (temple_id, financial_year)',
    ADD COLUMN annual_income               DECIMAL(15,2)    NULL,
    ADD COLUMN annual_expenditure          DECIMAL(15,2)    NULL,
    ADD COLUMN acknowledgement_doc_file_path VARCHAR(1000)  NULL             COMMENT 'Relative path to generated PDF ack under TRM_FILE_BASE_DIR',
    ADD COLUMN snapshot_json               JSON             NULL             COMMENT 'Full declaration snapshot frozen at PENDING_REVIEW',
    ADD COLUMN snapshot_file_path          VARCHAR(1000)    NULL             COMMENT 'File path alternative for snapshots > 10 KB',
    ADD COLUMN submitted_by                BIGINT           NULL,
    ADD COLUMN acknowledged_at             DATETIME(6)      NULL,
    ADD COLUMN is_overdue                  TINYINT(1)       NOT NULL DEFAULT 0,
    ADD COLUMN overdue_flagged_at          DATETIME(6)      NULL,
    ADD COLUMN clarification_round         TINYINT UNSIGNED NOT NULL DEFAULT 0;

-- Unique constraint per dc_e2e Section 4.8 (temple_id, financial_year, version_number)
ALTER TABLE asset_declarations
    ADD UNIQUE KEY uk_decl_temple_year_version (temple_id, financial_year, version_number);

-- Required index: overdue dashboard query (dc_e2e F9)
ALTER TABLE asset_declarations
    ADD INDEX idx_decl_temple_year (temple_id, financial_year);

-- Note: idx_decl_overdue and idx_decl_status already exist via V7; they remain valid.

-- -------------------------------------------------------
-- Add section_name to declaration_clarifications
-- Required for dc_e2e physical verification guard:
--   existsByDeclarationIdAndSectionNameAndDirection()
-- -------------------------------------------------------
ALTER TABLE declaration_clarifications
    ADD COLUMN section_name     VARCHAR(100) NULL COMMENT 'e.g. DECLARATION, PHYSICAL_VERIFICATION',
    ADD COLUMN field_names_json JSON         NULL COMMENT 'Optional JSON array of field names in scope';

-- Index for physical verification guard query (dc_e2e F5)
ALTER TABLE declaration_clarifications
    ADD INDEX idx_clar_section (declaration_id, section_name, direction);
