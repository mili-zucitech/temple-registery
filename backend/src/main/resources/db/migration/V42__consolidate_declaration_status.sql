-- V42: Consolidate DeclarationStatus enum to 12 canonical values
-- Additive-only migration: no column drops, no data loss.

-- 1. Migrate old DeclarationStatus values to new canonical values
--    (must run BEFORE the ENUM MODIFY so no row has an out-of-set value)
UPDATE asset_declarations SET status = 'SUBMITTED'
    WHERE status IN ('PENDING_REVIEW', 'RESUBMITTED');

UPDATE asset_declarations SET status = 'CLARIFICATION_REQUIRED'
    WHERE status = 'CLARIFICATION_REQUESTED';

UPDATE asset_declarations SET status = 'SITE_VISIT_SCHEDULED'
    WHERE status = 'PHYSICAL_VERIFICATION_REQUESTED';

-- 2. Modify the status ENUM column to include new values and remove old ones
--    MySQL requires a full column redefinition for ENUM changes
ALTER TABLE asset_declarations
    MODIFY COLUMN status ENUM(
        'DRAFT','SUBMITTED','UNDER_REVIEW',
        'CLARIFICATION_REQUIRED','CLARIFICATION_RESPONDED',
        'SITE_VISIT_SCHEDULED','SITE_VISIT_COMPLETED',
        'VERIFIED','APPROVED','REJECTED','OVERDUE','SUPERSEDED'
    ) NOT NULL DEFAULT 'DRAFT';

-- 3. Add UNIQUE constraint on acknowledgement_number (if not already present)
ALTER TABLE asset_declarations
    ADD CONSTRAINT IF NOT EXISTS uq_decl_ack_number UNIQUE (acknowledgement_number);

-- 4. Add actor_role column to governance_action_history (if not already present)
ALTER TABLE governance_action_history
    ADD COLUMN IF NOT EXISTS actor_role VARCHAR(32) NULL
        COMMENT 'Role of the actor who performed the action';
