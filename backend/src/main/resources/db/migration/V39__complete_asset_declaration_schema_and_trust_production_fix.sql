-- ============================================================
-- V39: Merged migration (resolves duplicate V39 conflict)
--   1. V39__complete_asset_declaration_schema.sql
--   2. V39__fix_trust_module_production.sql
-- ============================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Part 1: Complete Asset Declaration Schema
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE asset_declarations
    ADD COLUMN IF NOT EXISTS review_comment TEXT NULL;

ALTER TABLE decl_immov_leased
    ADD COLUMN IF NOT EXISTS monthly_rent DECIMAL(15,2) NULL,
    ADD COLUMN IF NOT EXISTS agreement_document_id BIGINT NULL;

ALTER TABLE decl_mov_artifact
    ADD COLUMN IF NOT EXISTS material VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS age_or_period VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS provenance TEXT NULL,
    ADD COLUMN IF NOT EXISTS museum_grade_classification VARCHAR(100) NULL;

ALTER TABLE decl_mov_equipment
    ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100) NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Part 2: Production hardening for Trust & Board module
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE board_members
    ADD COLUMN IF NOT EXISTS aadhaar_hash   VARCHAR(64)  NULL,
    ADD COLUMN IF NOT EXISTS aadhaar_last4  CHAR(4)      NULL;

SET @constraint_exists = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'board_members'
      AND CONSTRAINT_NAME = 'uq_bm_trust_aadhaar_hash'
);
SET @sql = IF(@constraint_exists = 0,
    'ALTER TABLE board_members ADD CONSTRAINT uq_bm_trust_aadhaar_hash UNIQUE (trust_id, aadhaar_hash)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @constraint_exists2 = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'trusts'
      AND CONSTRAINT_NAME = 'uq_trust_registration_number'
);
SET @sql2 = IF(@constraint_exists2 = 0,
    'ALTER TABLE trusts ADD CONSTRAINT uq_trust_registration_number UNIQUE (trust_registration_number)',
    'SELECT 1'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

SET @constraint_exists3 = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'trust_financials'
      AND CONSTRAINT_NAME = 'uq_tf_trust_year'
);
SET @sql3 = IF(@constraint_exists3 = 0,
    'ALTER TABLE trust_financials ADD CONSTRAINT uq_tf_trust_year UNIQUE (trust_id, financial_year)',
    'SELECT 1'
);
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

UPDATE temples t
SET t.trust_registered = EXISTS (
    SELECT 1 FROM trusts tr
    WHERE tr.temple_id = t.id AND tr.is_deleted = 0
);

DROP TABLE IF EXISTS board_member_staging;

UPDATE trusts
SET date_of_registration = CURDATE()
WHERE date_of_registration > CURDATE();
