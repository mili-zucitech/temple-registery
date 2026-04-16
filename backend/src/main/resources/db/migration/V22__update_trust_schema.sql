-- V22: Update trust schema according to new requirements
-- ────────────────────────────────────────────────────────────────────────

-- Update trusts table to match requirements
ALTER TABLE trusts
    RENAME COLUMN registration_number TO trust_registration_number,
    RENAME COLUMN registration_date TO date_of_registration,
    RENAME COLUMN pan_number TO trust_pan_number,
    DROP COLUMN address_line1,
    DROP COLUMN address_line2,
    DROP COLUMN pincode,
    DROP COLUMN version,
    DROP COLUMN dissolution_date,
    DROP COLUMN dissolution_reason;

ALTER TABLE trusts
    ADD COLUMN registering_authority VARCHAR(255) NOT NULL AFTER date_of_registration,
    ADD COLUMN trust_type ENUM('PUBLIC', 'PRIVATE') NOT NULL AFTER registering_authority,
    ADD COLUMN bank_account_number VARCHAR(50) NOT NULL AFTER trust_pan_number,
    ADD COLUMN bank_name_and_branch VARCHAR(255) NOT NULL AFTER bank_account_number,
    ADD COLUMN annual_income DECIMAL(15, 2) AFTER bank_name_and_branch;

-- Remove any extra columns not in the requirements
-- Only keep: trust_name, trust_registration_number, date_of_registration, registering_authority, trust_type, trust_pan_number, bank_account_number, bank_name_and_branch, annual_income
