-- ============================================================
-- V36: Remove DC approval workflow columns from employees and contractors.
--
-- Staff and Contractors no longer use DC approval.
-- Changes are effective immediately on save.
-- Trust and Asset Declaration approval workflow is UNCHANGED.
-- ============================================================

-- ─── EMPLOYEES ───────────────────────────────────────────────────────────────

ALTER TABLE employees
    DROP INDEX idx_employees_submission_status,
    DROP INDEX idx_employees_dc_decision_status,
    DROP COLUMN submission_status,
    DROP COLUMN system_verification_status,
    DROP COLUMN dc_decision_status,
    DROP COLUMN send_back_reason,
    DROP COLUMN governance_version;

-- ─── CONTRACTORS ─────────────────────────────────────────────────────────────

ALTER TABLE contractors
    DROP INDEX idx_contractors_submission_status,
    DROP INDEX idx_contractors_dc_decision_status,
    DROP COLUMN submission_status,
    DROP COLUMN system_verification_status,
    DROP COLUMN dc_decision_status,
    DROP COLUMN send_back_reason,
    DROP COLUMN governance_version;
