-- ============================================================
-- V38: Merged migration (resolves duplicate V38 conflict)
--   1. V38__enhance_asset_declaration_module.sql
--   2. V38__harden_trust_module.sql
-- ============================================================

-- ============================================================
-- PART 1: Enhance Asset Declaration Module
-- ============================================================

ALTER TABLE decl_immov_agri_land
    ADD COLUMN market_value DECIMAL(18,2) NULL,
    ADD COLUMN ownership_type VARCHAR(50) NULL,
    ADD COLUMN document_reference VARCHAR(200) NULL;

ALTER TABLE decl_immov_building
    ADD COLUMN building_name VARCHAR(255) NULL,
    ADD COLUMN location VARCHAR(500) NULL,
    ADD COLUMN year_of_construction INT NULL,
    ADD COLUMN usage_purpose VARCHAR(200) NULL,
    ADD COLUMN document_reference VARCHAR(200) NULL;

ALTER TABLE decl_immov_leased
    ADD COLUMN property_description TEXT NULL,
    ADD COLUMN lease_start_date DATE NULL,
    ADD COLUMN location VARCHAR(500) NULL,
    ADD COLUMN document_reference VARCHAR(200) NULL;

ALTER TABLE decl_immov_other
    ADD COLUMN land_type VARCHAR(100) NULL,
    ADD COLUMN location VARCHAR(500) NULL,
    ADD COLUMN ownership_type VARCHAR(50) NULL,
    ADD COLUMN document_reference VARCHAR(200) NULL;

ALTER TABLE decl_mov_precious_metal
    ADD COLUMN item_description TEXT NULL,
    ADD COLUMN acquisition_date DATE NULL,
    ADD COLUMN storage_location VARCHAR(255) NULL,
    ADD COLUMN document_reference VARCHAR(200) NULL;

ALTER TABLE decl_mov_artifact
    ADD COLUMN artifact_type VARCHAR(100) NULL,
    ADD COLUMN age_years INT NULL,
    ADD COLUMN historical_significance TEXT NULL,
    ADD COLUMN condition_text VARCHAR(100) NULL,
    ADD COLUMN document_reference VARCHAR(200) NULL;

ALTER TABLE decl_mov_vehicle
    ADD COLUMN make_and_model VARCHAR(200) NULL,
    ADD COLUMN usage_purpose VARCHAR(200) NULL,
    ADD COLUMN insurance_valid_till DATE NULL,
    ADD COLUMN document_reference VARCHAR(200) NULL;

ALTER TABLE decl_mov_equipment
    ADD COLUMN equipment_type VARCHAR(100) NULL,
    ADD COLUMN year_of_purchase INT NULL,
    ADD COLUMN condition_text VARCHAR(100) NULL,
    ADD COLUMN location VARCHAR(255) NULL,
    ADD COLUMN document_reference VARCHAR(200) NULL;

CREATE TABLE decl_mov_financial (
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
    ADD COLUMN annual_income DECIMAL(18,2) NULL,
    ADD COLUMN annual_expenditure DECIMAL(18,2) NULL;

-- ============================================================
-- PART 2: Harden Trust Module
-- ============================================================

ALTER TABLE board_meetings DROP FOREIGN KEY fk_board_meetings_trust;
ALTER TABLE trust_financials DROP FOREIGN KEY fk_tf_trust;

UPDATE board_members bm
JOIN trust_registrations old_trust ON old_trust.id = bm.trust_id
JOIN trusts new_trust ON new_trust.temple_id = old_trust.temple_id
SET bm.trust_id = new_trust.id;

UPDATE board_meetings meeting
JOIN trust_registrations old_trust ON old_trust.id = meeting.trust_id
JOIN trusts new_trust ON new_trust.temple_id = old_trust.temple_id
SET meeting.trust_id = new_trust.id;

UPDATE trust_financials financial
JOIN trust_registrations old_trust ON old_trust.id = financial.trust_id
JOIN trusts new_trust ON new_trust.temple_id = old_trust.temple_id
SET financial.trust_id = new_trust.id;

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

ALTER TABLE trusts
    ADD CONSTRAINT uq_trust_registration_number UNIQUE (trust_registration_number);

ALTER TABLE board_meetings
    ADD CONSTRAINT fk_board_meetings_trust
        FOREIGN KEY (trust_id) REFERENCES trusts (id);

ALTER TABLE trust_financials
    ADD CONSTRAINT fk_tf_trust
        FOREIGN KEY (trust_id) REFERENCES trusts (id);
