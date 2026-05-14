-- ============================================================
-- V38: Merged migration (resolves duplicate V38 conflict)
--   1. V38__enhance_asset_declaration_module.sql
--   2. V38__harden_trust_module.sql
-- ============================================================

-- ============================================================
-- PART 1: Enhance Asset Declaration Module
-- ============================================================

ALTER TABLE decl_immov_agri_land
    ADD COLUMN IF NOT EXISTS market_value DECIMAL(18,2) NULL,
    ADD COLUMN IF NOT EXISTS ownership_type VARCHAR(50) NULL,
    ADD COLUMN IF NOT EXISTS document_reference VARCHAR(200) NULL;

ALTER TABLE decl_immov_building
    ADD COLUMN IF NOT EXISTS building_name VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS location VARCHAR(500) NULL,
    ADD COLUMN IF NOT EXISTS year_of_construction INT NULL,
    ADD COLUMN IF NOT EXISTS usage_purpose VARCHAR(200) NULL,
    ADD COLUMN IF NOT EXISTS document_reference VARCHAR(200) NULL;

ALTER TABLE decl_immov_leased
    ADD COLUMN IF NOT EXISTS property_description TEXT NULL,
    ADD COLUMN IF NOT EXISTS lease_start_date DATE NULL,
    ADD COLUMN IF NOT EXISTS location VARCHAR(500) NULL,
    ADD COLUMN IF NOT EXISTS document_reference VARCHAR(200) NULL;

ALTER TABLE decl_immov_other
    ADD COLUMN IF NOT EXISTS land_type VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS location VARCHAR(500) NULL,
    ADD COLUMN IF NOT EXISTS ownership_type VARCHAR(50) NULL,
    ADD COLUMN IF NOT EXISTS document_reference VARCHAR(200) NULL;

ALTER TABLE decl_mov_precious_metal
    ADD COLUMN IF NOT EXISTS item_description TEXT NULL,
    ADD COLUMN IF NOT EXISTS acquisition_date DATE NULL,
    ADD COLUMN IF NOT EXISTS storage_location VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS document_reference VARCHAR(200) NULL;

ALTER TABLE decl_mov_artifact
    ADD COLUMN IF NOT EXISTS artifact_type VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS age_years INT NULL,
    ADD COLUMN IF NOT EXISTS historical_significance TEXT NULL,
    ADD COLUMN IF NOT EXISTS condition_text VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS document_reference VARCHAR(200) NULL;

ALTER TABLE decl_mov_vehicle
    ADD COLUMN IF NOT EXISTS make_and_model VARCHAR(200) NULL,
    ADD COLUMN IF NOT EXISTS usage_purpose VARCHAR(200) NULL,
    ADD COLUMN IF NOT EXISTS insurance_valid_till DATE NULL,
    ADD COLUMN IF NOT EXISTS document_reference VARCHAR(200) NULL;

ALTER TABLE decl_mov_equipment
    ADD COLUMN IF NOT EXISTS equipment_type VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS year_of_purchase INT NULL,
    ADD COLUMN IF NOT EXISTS condition_text VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS location VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS document_reference VARCHAR(200) NULL;

CREATE TABLE IF NOT EXISTS decl_mov_financial (
    id                      BIGINT         NOT NULL AUTO_INCREMENT,
    declaration_id          BIGINT         NOT NULL,
    asset_type              VARCHAR(100)   NOT NULL,
    institution_name        VARCHAR(255)   NULL,
    account_number          VARCHAR(100)   NULL,
    maturity_date           DATE           NULL,
    interest_rate           DECIMAL(5,2)   NULL,
    current_value           DECIMAL(18,2)  NOT NULL,
    description             TEXT           NULL,
    document_reference      VARCHAR(200)   NULL,
    PRIMARY KEY (id),
    INDEX idx_dmf_decl (declaration_id),
    CONSTRAINT fk_dmf_decl FOREIGN KEY (declaration_id) REFERENCES asset_declarations (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE asset_declarations
    ADD COLUMN IF NOT EXISTS annual_income DECIMAL(18,2) NULL,
    ADD COLUMN IF NOT EXISTS annual_expenditure DECIMAL(18,2) NULL;

-- ============================================================
-- PART 2: Harden Trust Module
-- ============================================================

-- Drop FK constraints that point to the old trust_registrations table (dropped in V21).
-- These FKs now correctly reference the new 'trusts' table (re-added below).
ALTER TABLE board_meetings DROP FOREIGN KEY fk_board_meetings_trust;
ALTER TABLE trust_financials DROP FOREIGN KEY fk_tf_trust;

-- NOTE: trust_registrations was dropped in V21 and replaced by 'trusts'.
-- Any trust_financials rows that reference the old (now-gone) trust_registrations IDs
-- are orphaned and must be removed before re-adding the FK constraint to 'trusts'.
DELETE FROM trust_financials
WHERE trust_id NOT IN (SELECT id FROM trusts WHERE is_deleted = 0);

-- The three UPDATE statements that migrated FK references from trust_registrations
-- to trusts are no longer applicable: trust_registrations no longer exists and
-- all new data is seeded directly into the 'trusts' table.

UPDATE trusts
SET date_of_registration = CURDATE()
WHERE date_of_registration > CURDATE();

UPDATE temples t
SET t.trust_registered = EXISTS (
    SELECT 1
    FROM trusts tr
    WHERE tr.temple_id = t.id
      AND tr.is_deleted = 0
);

SET @idx := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='trusts' AND CONSTRAINT_NAME='uq_trust_registration_number');
SET @s := IF(@idx = 0, 'ALTER TABLE trusts ADD CONSTRAINT uq_trust_registration_number UNIQUE (trust_registration_number)', 'SELECT 1');
PREPARE p FROM @s; EXECUTE p; DEALLOCATE PREPARE p;

ALTER TABLE board_meetings
    ADD CONSTRAINT fk_board_meetings_trust
        FOREIGN KEY (trust_id) REFERENCES trusts (id);

-- Delete orphaned trust_financials rows before re-adding FK
DELETE FROM trust_financials WHERE trust_id NOT IN (SELECT id FROM trusts);

ALTER TABLE trust_financials
    ADD CONSTRAINT fk_tf_trust
        FOREIGN KEY (trust_id) REFERENCES trusts (id);
