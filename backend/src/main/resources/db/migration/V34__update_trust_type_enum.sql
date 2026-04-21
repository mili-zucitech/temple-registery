-- V34: Expand trust_type ENUM to match unified frontend/backend values
-- Old values: PUBLIC, PRIVATE
-- New values: SINGLE_TRUSTEE, MULTI_TRUSTEE, ENDOWMENT, DEVASWOM, OTHER
-- Existing PUBLIC rows → MULTI_TRUSTEE, PRIVATE rows → SINGLE_TRUSTEE (best-effort migration)

ALTER TABLE trusts
    MODIFY COLUMN trust_type ENUM('SINGLE_TRUSTEE','MULTI_TRUSTEE','ENDOWMENT','DEVASWOM','OTHER') NOT NULL DEFAULT 'MULTI_TRUSTEE';

-- Migrate legacy values
UPDATE trusts SET trust_type = 'MULTI_TRUSTEE' WHERE trust_type = 'PUBLIC';
UPDATE trusts SET trust_type = 'SINGLE_TRUSTEE' WHERE trust_type = 'PRIVATE';
