-- ============================================================
-- V35: Fix and Enhance Employees Table
-- Aligns with entity fields and adds DC workflow support
-- ============================================================

-- Drop old columns that don't match entity
ALTER TABLE employees
    DROP COLUMN IF EXISTS joining_date,
    DROP COLUMN IF EXISTS leaving_date,
    DROP COLUMN IF EXISTS email;

-- Add missing columns to match Employee entity
ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS employee_ref VARCHAR(50) NULL COMMENT 'Internal HR identifier' AFTER temple_id,
    ADD COLUMN IF NOT EXISTS date_of_joining DATE NULL COMMENT 'Employee joining date' AFTER mobile,
    ADD COLUMN IF NOT EXISTS salary_grade VARCHAR(50) NULL COMMENT 'Salary grade or band' AFTER designation,
    ADD COLUMN IF NOT EXISTS address TEXT NULL COMMENT 'Residential address' AFTER mobile,
    ADD COLUMN IF NOT EXISTS is_hereditary TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Hereditary position flag' AFTER address,
    ADD COLUMN IF NOT EXISTS date_of_leaving DATE NULL COMMENT 'Required for RETIRED/RESIGNED status' AFTER status;

-- Add DC governance and workflow fields
ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS submission_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT|PENDING_REVIEW|APPROVED|REJECTED' AFTER status,
    ADD COLUMN IF NOT EXISTS submitted_at DATETIME NULL COMMENT 'When submitted for DC review' AFTER submission_status,
    ADD COLUMN IF NOT EXISTS submitted_by BIGINT NULL COMMENT 'User who submitted' AFTER submitted_at,
    ADD COLUMN IF NOT EXISTS reviewed_at DATETIME NULL COMMENT 'When DC reviewed' AFTER submitted_by,
    ADD COLUMN IF NOT EXISTS reviewed_by BIGINT NULL COMMENT 'DC user who reviewed' AFTER reviewed_at,
    ADD COLUMN IF NOT EXISTS review_remarks TEXT NULL COMMENT 'DC review comments' AFTER reviewed_by,
    ADD COLUMN IF NOT EXISTS is_verified_by_dc TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'DC verification flag' AFTER review_remarks,
    ADD COLUMN IF NOT EXISTS verified_by_dc_at DATETIME NULL COMMENT 'DC verification timestamp' AFTER is_verified_by_dc,
    ADD COLUMN IF NOT EXISTS verified_by_dc_user_id BIGINT NULL COMMENT 'DC user who verified' AFTER verified_by_dc_at,
    ADD COLUMN IF NOT EXISTS dc_flag_reason TEXT NULL COMMENT 'Reason if flagged by DC' AFTER verified_by_dc_user_id;

-- Update column sizes to match entity
ALTER TABLE employees
    MODIFY COLUMN full_name VARCHAR(200) NOT NULL,
    MODIFY COLUMN employee_type VARCHAR(30) NOT NULL,
    MODIFY COLUMN designation VARCHAR(150) NULL,
    MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_submission_status ON employees(submission_status);
CREATE INDEX IF NOT EXISTS idx_employees_employee_ref ON employees(employee_ref);
CREATE INDEX IF NOT EXISTS idx_employees_employee_type ON employees(employee_type);
CREATE INDEX IF NOT EXISTS idx_employees_verified ON employees(is_verified_by_dc);

-- Add unique constraint on employee_ref per temple
CREATE UNIQUE INDEX IF NOT EXISTS uk_employees_temple_ref ON employees(temple_id, employee_ref);
