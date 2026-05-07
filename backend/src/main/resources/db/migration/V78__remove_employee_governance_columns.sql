-- V78: Remove DC governance columns from employees table
-- These columns violate the "Employee is administrative-only" constraint.
-- Employee module has no governance approval workflow.
-- DcEmployeeController approve/reject endpoints and EmployeeService DC methods
-- have been removed in the same release as this migration.

ALTER TABLE employees
    DROP INDEX IF EXISTS idx_employees_verified;

ALTER TABLE employees
    DROP COLUMN IF EXISTS is_verified_by_dc,
    DROP COLUMN IF EXISTS verified_by_dc_at,
    DROP COLUMN IF EXISTS verified_by_dc_user_id,
    DROP COLUMN IF EXISTS dc_flag_reason,
    DROP COLUMN IF EXISTS submitted_at,
    DROP COLUMN IF EXISTS submitted_by,
    DROP COLUMN IF EXISTS reviewed_at,
    DROP COLUMN IF EXISTS reviewed_by,
    DROP COLUMN IF EXISTS review_remarks;
