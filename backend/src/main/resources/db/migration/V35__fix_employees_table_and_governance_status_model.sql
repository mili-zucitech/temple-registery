-- ============================================================
-- V35: Merged migration (resolves duplicate V35 conflict)
--   1. V35__fix_and_enhance_employees_table.sql
--   2. V35__governance_status_model.sql
-- ============================================================

-- ─── PART 1: Fix and Enhance Employees Table ────────────────────────────────

ALTER TABLE employees
    DROP COLUMN IF EXISTS joining_date,
    DROP COLUMN IF EXISTS leaving_date,
    DROP COLUMN IF EXISTS email;

ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS employee_ref VARCHAR(50) NULL,
    ADD COLUMN IF NOT EXISTS date_of_joining DATE NULL,
    ADD COLUMN IF NOT EXISTS salary_grade VARCHAR(50) NULL,
    ADD COLUMN IF NOT EXISTS address TEXT NULL,
    ADD COLUMN IF NOT EXISTS is_hereditary TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS date_of_leaving DATE NULL;

ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS submitted_at DATETIME NULL,
    ADD COLUMN IF NOT EXISTS submitted_by BIGINT NULL,
    ADD COLUMN IF NOT EXISTS reviewed_at DATETIME NULL,
    ADD COLUMN IF NOT EXISTS reviewed_by BIGINT NULL,
    ADD COLUMN IF NOT EXISTS review_remarks TEXT NULL,
    ADD COLUMN IF NOT EXISTS is_verified_by_dc TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS verified_by_dc_at DATETIME NULL,
    ADD COLUMN IF NOT EXISTS verified_by_dc_user_id BIGINT NULL,
    ADD COLUMN IF NOT EXISTS dc_flag_reason TEXT NULL;

ALTER TABLE employees
    MODIFY COLUMN full_name VARCHAR(200) NOT NULL,
    MODIFY COLUMN employee_type VARCHAR(30) NOT NULL,
    MODIFY COLUMN designation VARCHAR(150) NULL,
    MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_employees_employee_ref ON employees(employee_ref);
CREATE INDEX IF NOT EXISTS idx_employees_employee_type ON employees(employee_type);
CREATE INDEX IF NOT EXISTS idx_employees_verified ON employees(is_verified_by_dc);

CREATE UNIQUE INDEX IF NOT EXISTS uk_employees_temple_ref ON employees(temple_id, employee_ref);

-- ─── PART 2: Governance 3-Layer Status Model ────────────────────────────────

-- ─── TRUSTS ──────────────────────────────────────────────────────────────────

ALTER TABLE trusts
    ADD COLUMN submission_status ENUM(
        'DRAFT','SUBMITTED','SENT_BACK','APPROVED','REJECTED'
    ) NOT NULL DEFAULT 'DRAFT',

    ADD COLUMN system_verification_status ENUM(
        'SYSTEM_VERIFIED','SYSTEM_FLAGGED','SYSTEM_INVALID'
    ) NULL DEFAULT NULL,

    ADD COLUMN dc_decision_status ENUM(
        'PENDING_DC_APPROVAL','APPROVED_BY_DC','REJECTED_BY_DC'
    ) NOT NULL DEFAULT 'PENDING_DC_APPROVAL',

    ADD COLUMN send_back_reason TEXT NULL,

    ADD COLUMN governance_version BIGINT NOT NULL DEFAULT 1;

CREATE INDEX idx_trusts_submission_status ON trusts(submission_status);
CREATE INDEX idx_trusts_dc_decision_status ON trusts(dc_decision_status);

-- ─── EMPLOYEES ───────────────────────────────────────────────────────────────

ALTER TABLE employees
    ADD COLUMN submission_status ENUM(
        'DRAFT','SUBMITTED','SENT_BACK','APPROVED','REJECTED'
    ) NOT NULL DEFAULT 'DRAFT',

    ADD COLUMN system_verification_status ENUM(
        'SYSTEM_VERIFIED','SYSTEM_FLAGGED','SYSTEM_INVALID'
    ) NULL DEFAULT NULL,

    ADD COLUMN dc_decision_status ENUM(
        'PENDING_DC_APPROVAL','APPROVED_BY_DC','REJECTED_BY_DC'
    ) NOT NULL DEFAULT 'PENDING_DC_APPROVAL',

    ADD COLUMN send_back_reason TEXT NULL,

    ADD COLUMN governance_version BIGINT NOT NULL DEFAULT 1;

CREATE INDEX idx_employees_submission_status ON employees(submission_status);
CREATE INDEX idx_employees_dc_decision_status ON employees(dc_decision_status);

-- ─── CONTRACTORS ─────────────────────────────────────────────────────────────

ALTER TABLE contractors
    ADD COLUMN submission_status ENUM(
        'DRAFT','SUBMITTED','SENT_BACK','APPROVED','REJECTED'
    ) NOT NULL DEFAULT 'DRAFT',

    ADD COLUMN system_verification_status ENUM(
        'SYSTEM_VERIFIED','SYSTEM_FLAGGED','SYSTEM_INVALID'
    ) NULL DEFAULT NULL,

    ADD COLUMN dc_decision_status ENUM(
        'PENDING_DC_APPROVAL','APPROVED_BY_DC','REJECTED_BY_DC'
    ) NOT NULL DEFAULT 'PENDING_DC_APPROVAL',

    ADD COLUMN send_back_reason TEXT NULL,

    ADD COLUMN governance_version BIGINT NOT NULL DEFAULT 1;

CREATE INDEX idx_contractors_submission_status ON contractors(submission_status);
CREATE INDEX idx_contractors_dc_decision_status ON contractors(dc_decision_status);

-- ─── ASSET DECLARATIONS ──────────────────────────────────────────────────────

ALTER TABLE asset_declarations
    ADD COLUMN submission_status ENUM(
        'DRAFT','SUBMITTED','SENT_BACK','APPROVED','REJECTED'
    ) NOT NULL DEFAULT 'DRAFT',

    ADD COLUMN system_verification_status ENUM(
        'SYSTEM_VERIFIED','SYSTEM_FLAGGED','SYSTEM_INVALID'
    ) NULL DEFAULT NULL,

    ADD COLUMN dc_decision_status ENUM(
        'PENDING_DC_APPROVAL','APPROVED_BY_DC','REJECTED_BY_DC'
    ) NOT NULL DEFAULT 'PENDING_DC_APPROVAL',

    ADD COLUMN send_back_reason TEXT NULL,

    ADD COLUMN physical_verification_status ENUM(
        'NOT_INITIATED','ORDERED_FOR_PHYSICAL_VERIFICATION','PHYSICALLY_VERIFIED','VERIFICATION_FAILED'
    ) NOT NULL DEFAULT 'NOT_INITIATED',

    ADD COLUMN physical_verification_ordered_at DATETIME NULL,
    ADD COLUMN physical_verification_ordered_by BIGINT NULL,
    ADD COLUMN physical_verification_completed_at DATETIME NULL,

    ADD COLUMN governance_version BIGINT NOT NULL DEFAULT 1;

CREATE INDEX idx_decl_submission_status ON asset_declarations(submission_status);
CREATE INDEX idx_decl_dc_decision_status ON asset_declarations(dc_decision_status);
CREATE INDEX idx_decl_phys_verif_status ON asset_declarations(physical_verification_status);

-- ─── PHYSICAL VERIFICATION HISTORY ───────────────────────────────────────────

CREATE TABLE physical_verification_history (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    declaration_id      BIGINT NOT NULL,
    dc_user_id          BIGINT NOT NULL,
    previous_status     VARCHAR(50) NOT NULL,
    new_status          VARCHAR(50) NOT NULL,
    notes               TEXT NULL,
    occurred_at         DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_pvh_declaration_id (declaration_id),
    INDEX idx_pvh_dc_user_id (dc_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
