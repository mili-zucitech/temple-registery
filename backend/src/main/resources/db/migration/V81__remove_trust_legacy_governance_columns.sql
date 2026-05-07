-- V81: Remove legacy governance status columns from trusts table
-- submission_status, dc_decision_status, and dc_flag_reason are fully replaced by
-- WorkflowInstance.status (canonical source of truth from Phase A onwards).
-- Trust.sendBackReason is retained — it is display data, not a governance status field.

ALTER TABLE trusts
    DROP COLUMN submission_status,
    DROP COLUMN dc_decision_status,
    DROP COLUMN dc_flag_reason;
