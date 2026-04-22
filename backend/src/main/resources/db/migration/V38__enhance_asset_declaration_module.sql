-- ============================================================
-- V38: Enhance Asset Declaration Module
-- Adds missing fields to existing sub-tables and creates financial assets table
-- ============================================================

-- -------------------------------------------------------------------
-- Add missing fields to decl_immov_agri_land
-- -------------------------------------------------------------------
ALTER TABLE decl_immov_agri_land
    ADD COLUMN market_value DECIMAL(18,2) NULL COMMENT 'Current market value of the land',
    ADD COLUMN ownership_type VARCHAR(50) NULL COMMENT 'OWNED, LEASED, DONATED',
    ADD COLUMN document_reference VARCHAR(200) NULL COMMENT 'Reference to supporting documents';

-- -------------------------------------------------------------------
-- Add missing fields to decl_immov_building
-- -------------------------------------------------------------------
ALTER TABLE decl_immov_building
    ADD COLUMN building_name VARCHAR(255) NULL COMMENT 'Name or identifier of the building',
    ADD COLUMN location VARCHAR(500) NULL COMMENT 'Physical location/address',
    ADD COLUMN year_of_construction INT NULL COMMENT 'Year when building was constructed',
    ADD COLUMN usage_purpose VARCHAR(200) NULL COMMENT 'Temple hall, office, residence, etc.',
    ADD COLUMN document_reference VARCHAR(200) NULL COMMENT 'Reference to supporting documents';

-- -------------------------------------------------------------------
-- Add missing fields to decl_immov_leased
-- -------------------------------------------------------------------
ALTER TABLE decl_immov_leased
    ADD COLUMN property_description TEXT NULL COMMENT 'Description of the leased property',
    ADD COLUMN lease_start_date DATE NULL COMMENT 'Start date of the lease',
    ADD COLUMN location VARCHAR(500) NULL COMMENT 'Physical location of the property',
    ADD COLUMN document_reference VARCHAR(200) NULL COMMENT 'Reference to lease agreement';

-- -------------------------------------------------------------------
-- Add missing fields to decl_immov_other
-- -------------------------------------------------------------------
ALTER TABLE decl_immov_other
    ADD COLUMN land_type VARCHAR(100) NULL COMMENT 'Type of land (vacant, forest, water body, etc.)',
    ADD COLUMN location VARCHAR(500) NULL COMMENT 'Physical location',
    ADD COLUMN ownership_type VARCHAR(50) NULL COMMENT 'OWNED, LEASED, DONATED',
    ADD COLUMN document_reference VARCHAR(200) NULL COMMENT 'Reference to supporting documents';

-- -------------------------------------------------------------------
-- Add missing fields to decl_mov_precious_metal
-- -------------------------------------------------------------------
ALTER TABLE decl_mov_precious_metal
    ADD COLUMN item_description TEXT NULL COMMENT 'Detailed description of the item',
    ADD COLUMN acquisition_date DATE NULL COMMENT 'Date when item was acquired',
    ADD COLUMN storage_location VARCHAR(255) NULL COMMENT 'Where the item is stored',
    ADD COLUMN document_reference VARCHAR(200) NULL COMMENT 'Reference to supporting documents';

-- -------------------------------------------------------------------
-- Add missing fields to decl_mov_artifact
-- -------------------------------------------------------------------
ALTER TABLE decl_mov_artifact
    ADD COLUMN artifact_type VARCHAR(100) NULL COMMENT 'Idol, painting, sculpture, manuscript, etc.',
    ADD COLUMN age_years INT NULL COMMENT 'Approximate age in years',
    ADD COLUMN historical_significance TEXT NULL COMMENT 'Historical or cultural significance',
    ADD COLUMN condition_text VARCHAR(100) NULL COMMENT 'Current condition',
    ADD COLUMN document_reference VARCHAR(200) NULL COMMENT 'Reference to supporting documents';

-- -------------------------------------------------------------------
-- Add missing fields to decl_mov_vehicle
-- -------------------------------------------------------------------
ALTER TABLE decl_mov_vehicle
    ADD COLUMN make_and_model VARCHAR(200) NULL COMMENT 'Manufacturer and model',
    ADD COLUMN usage_purpose VARCHAR(200) NULL COMMENT 'Purpose of the vehicle',
    ADD COLUMN insurance_valid_till DATE NULL COMMENT 'Insurance expiry date',
    ADD COLUMN document_reference VARCHAR(200) NULL COMMENT 'Reference to RC book, insurance';

-- -------------------------------------------------------------------
-- Add missing fields to decl_mov_equipment
-- -------------------------------------------------------------------
ALTER TABLE decl_mov_equipment
    ADD COLUMN equipment_type VARCHAR(100) NULL COMMENT 'Type/category of equipment',
    ADD COLUMN year_of_purchase INT NULL COMMENT 'Year when purchased',
    ADD COLUMN condition_text VARCHAR(100) NULL COMMENT 'Current condition',
    ADD COLUMN location VARCHAR(255) NULL COMMENT 'Where the equipment is located',
    ADD COLUMN document_reference VARCHAR(200) NULL COMMENT 'Reference to supporting documents';

-- -------------------------------------------------------------------
-- Create NEW table: decl_mov_financial (Financial Assets)
-- Includes FDs, investments, bonds, bank balances, etc.
-- -------------------------------------------------------------------
CREATE TABLE decl_mov_financial (
    id                      BIGINT         NOT NULL AUTO_INCREMENT,
    declaration_id          BIGINT         NOT NULL,
    asset_type              VARCHAR(100)   NOT NULL COMMENT 'FIXED_DEPOSIT, SAVINGS_ACCOUNT, MUTUAL_FUND, BOND, SHARE, OTHER',
    institution_name        VARCHAR(255)   NULL COMMENT 'Bank or financial institution name',
    account_number          VARCHAR(100)   NULL COMMENT 'Account/FD/Folio number (last 4 digits only for security)',
    maturity_date           DATE           NULL COMMENT 'Maturity date for FDs and bonds',
    interest_rate           DECIMAL(5,2)   NULL COMMENT 'Interest rate percentage',
    current_value           DECIMAL(18,2)  NOT NULL COMMENT 'Current value of the asset',
    description             TEXT           NULL COMMENT 'Additional details',
    document_reference      VARCHAR(200)   NULL COMMENT 'Reference to supporting documents',
    PRIMARY KEY (id),
    INDEX idx_dmf_decl (declaration_id),
    CONSTRAINT fk_dmf_decl FOREIGN KEY (declaration_id) REFERENCES asset_declarations (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------
-- Add annual_income and annual_expenditure to asset_declarations
-- -------------------------------------------------------------------
ALTER TABLE asset_declarations
    ADD COLUMN annual_income DECIMAL(18,2) NULL COMMENT 'Total annual income of the temple',
    ADD COLUMN annual_expenditure DECIMAL(18,2) NULL COMMENT 'Total annual expenditure of the temple';

