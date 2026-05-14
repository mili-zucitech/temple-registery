-- V92: Add approved_data column to trusts table
-- Purpose: Store a JSON snapshot of non-sensitive trust fields at last approval.
-- When a subsequent edit is rejected, this snapshot is used to restore
-- the approved values — preventing edited-and-rejected values from persisting.
-- Trusts that have never been approved will have NULL here.
ALTER TABLE trusts
    ADD COLUMN IF NOT EXISTS approved_data TEXT NULL
    COMMENT 'JSON snapshot of non-sensitive trust fields at last DC/SA approval. NULL if never approved. Used to restore on edit-rejection.';

-- Backfill: for all trusts whose workflow instance is APPROVED or RE_APPROVED,
-- populate approved_data with the current trust fields so rejection of a future
-- edit can restore them.  Trusts in SUBMITTED/UNDER_REVIEW/RESUBMITTED state
-- are NOT backfilled here — they have never had an approved snapshot.
UPDATE trusts t
INNER JOIN workflow_instances wi
    ON wi.entity_type = 'TRUST'
    AND wi.entity_id = t.id
    AND wi.is_deleted = 0
SET t.approved_data = JSON_OBJECT(
    'trustName',              t.trust_name,
    'trustType',              t.trust_type,
    'trustRegistrationNumber',t.trust_registration_number,
    'registeringAuthority',   t.registering_authority,
    'dateOfRegistration',     DATE_FORMAT(t.date_of_registration, '%Y-%m-%d'),
    'bankNameAndBranch',      t.bank_name_and_branch,
    'annualIncome',           t.annual_income
)
WHERE wi.status IN ('APPROVED', 'RE_APPROVED')
  AND t.approved_data IS NULL
  AND t.is_deleted = 0;
