-- ============================================================
-- V35: Governance 3-Layer Status Model
-- Adds submission_status, system_verification_status, dc_decision_status,
-- send_back_reason, and physical_verification_status (declarations only)
-- to all governed modules: trusts, employees, contractors, asset_declarations
-- ============================================================

-- ─── TRUSTS ──────────────────────────────────────────────────────────────────

ALTER TABLE trusts
    ADD COLUMN submission_status ENUM(
        'DRAFT','SUBMITTED','SENT_BACK','APPROVED','REJECTED'
    ) NOT NULL DEFAULT 'DRAFT'
        COMMENT 'Visible to all roles. Drives TA workflow.' AFTER status,

    ADD COLUMN system_verification_status ENUM(
        'SYSTEM_VERIFIED','SYSTEM_FLAGGED','SYSTEM_INVALID'
    ) NULL DEFAULT NULL
        COMMENT 'INTERNAL ONLY — never exposed to Temple Authority.' AFTER submission_status,

    ADD COLUMN dc_decision_status ENUM(
        'PENDING_DC_APPROVAL','APPROVED_BY_DC','REJECTED_BY_DC'
    ) NOT NULL DEFAULT 'PENDING_DC_APPROVAL'
        COMMENT 'DC decision outcome. Visible to all roles.' AFTER system_verification_status,

    ADD COLUMN send_back_reason TEXT NULL
        COMMENT 'Free-text reason entered by DC on Send Back. Visible to Temple Authority.' AFTER dc_decision_status,

    ADD COLUMN governance_version BIGINT NOT NULL DEFAULT 1
        COMMENT 'Increments on every governance state change for optimistic locking.' AFTER send_back_reason;

CREATE INDEX idx_trusts_submission_status ON trusts(submission_status);
CREATE INDEX idx_trusts_dc_decision_status ON trusts(dc_decision_status);

-- ─── EMPLOYEES ───────────────────────────────────────────────────────────────

ALTER TABLE employees
    ADD COLUMN submission_status ENUM(
        'DRAFT','SUBMITTED','SENT_BACK','APPROVED','REJECTED'
    ) NOT NULL DEFAULT 'DRAFT'
        COMMENT 'Visible to all roles. Drives TA workflow.' AFTER status,

    ADD COLUMN system_verification_status ENUM(
        'SYSTEM_VERIFIED','SYSTEM_FLAGGED','SYSTEM_INVALID'
    ) NULL DEFAULT NULL
        COMMENT 'INTERNAL ONLY — never exposed to Temple Authority.' AFTER submission_status,

    ADD COLUMN dc_decision_status ENUM(
        'PENDING_DC_APPROVAL','APPROVED_BY_DC','REJECTED_BY_DC'
    ) NOT NULL DEFAULT 'PENDING_DC_APPROVAL'
        COMMENT 'DC decision outcome. Visible to all roles.' AFTER system_verification_status,

    ADD COLUMN send_back_reason TEXT NULL
        COMMENT 'Free-text reason entered by DC on Send Back. Visible to Temple Authority.' AFTER dc_decision_status,

    ADD COLUMN governance_version BIGINT NOT NULL DEFAULT 1
        COMMENT 'Increments on every governance state change for optimistic locking.' AFTER send_back_reason;

CREATE INDEX idx_employees_submission_status ON employees(submission_status);
CREATE INDEX idx_employees_dc_decision_status ON employees(dc_decision_status);

-- ─── CONTRACTORS ─────────────────────────────────────────────────────────────

ALTER TABLE contractors
    ADD COLUMN submission_status ENUM(
        'DRAFT','SUBMITTED','SENT_BACK','APPROVED','REJECTED'
    ) NOT NULL DEFAULT 'DRAFT'
        COMMENT 'Visible to all roles. Drives TA workflow.' AFTER payment_status,

    ADD COLUMN system_verification_status ENUM(
        'SYSTEM_VERIFIED','SYSTEM_FLAGGED','SYSTEM_INVALID'
    ) NULL DEFAULT NULL
        COMMENT 'INTERNAL ONLY — never exposed to Temple Authority.' AFTER submission_status,

    ADD COLUMN dc_decision_status ENUM(
        'PENDING_DC_APPROVAL','APPROVED_BY_DC','REJECTED_BY_DC'
    ) NOT NULL DEFAULT 'PENDING_DC_APPROVAL'
        COMMENT 'DC decision outcome. Visible to all roles.' AFTER system_verification_status,

    ADD COLUMN send_back_reason TEXT NULL
        COMMENT 'Free-text reason entered by DC on Send Back. Visible to Temple Authority.' AFTER dc_decision_status,

    ADD COLUMN governance_version BIGINT NOT NULL DEFAULT 1
        COMMENT 'Increments on every governance state change for optimistic locking.' AFTER send_back_reason;

CREATE INDEX idx_contractors_submission_status ON contractors(submission_status);
CREATE INDEX idx_contractors_dc_decision_status ON contractors(dc_decision_status);

-- ─── ASSET DECLARATIONS ──────────────────────────────────────────────────────
-- Declarations already have a status column; we add the 3-layer model
-- PLUS the physical_verification_status (DC-only, never visible to TA).

ALTER TABLE asset_declarations
    ADD COLUMN submission_status ENUM(
        'DRAFT','SUBMITTED','SENT_BACK','APPROVED','REJECTED'
    ) NOT NULL DEFAULT 'DRAFT'
        COMMENT 'Visible to all roles. Drives TA workflow.' AFTER status,

    ADD COLUMN system_verification_status ENUM(
        'SYSTEM_VERIFIED','SYSTEM_FLAGGED','SYSTEM_INVALID'
    ) NULL DEFAULT NULL
        COMMENT 'INTERNAL ONLY — never exposed to Temple Authority.' AFTER submission_status,

    ADD COLUMN dc_decision_status ENUM(
        'PENDING_DC_APPROVAL','APPROVED_BY_DC','REJECTED_BY_DC'
    ) NOT NULL DEFAULT 'PENDING_DC_APPROVAL'
        COMMENT 'DC decision outcome. Visible to all roles.' AFTER system_verification_status,

    ADD COLUMN send_back_reason TEXT NULL
        COMMENT 'Free-text reason entered by DC on Send Back. Visible to Temple Authority.' AFTER dc_decision_status,

    ADD COLUMN physical_verification_status ENUM(
        'NOT_INITIATED','ORDERED_FOR_PHYSICAL_VERIFICATION','PHYSICALLY_VERIFIED','VERIFICATION_FAILED'
    ) NOT NULL DEFAULT 'NOT_INITIATED'
        COMMENT 'DC-only. NEVER visible to Temple Authority. Manually set by DC only.' AFTER send_back_reason,

    ADD COLUMN physical_verification_ordered_at DATETIME NULL
        COMMENT 'Timestamp when DC ordered physical verification.' AFTER physical_verification_status,

    ADD COLUMN physical_verification_ordered_by BIGINT NULL
        COMMENT 'User ID of DC who ordered physical verification.' AFTER physical_verification_ordered_at,

    ADD COLUMN physical_verification_completed_at DATETIME NULL
        COMMENT 'Timestamp when physical verification was completed.' AFTER physical_verification_ordered_by,

    ADD COLUMN governance_version BIGINT NOT NULL DEFAULT 1
        COMMENT 'Increments on every governance state change for optimistic locking.' AFTER physical_verification_completed_at;

CREATE INDEX idx_decl_submission_status ON asset_declarations(submission_status);
CREATE INDEX idx_decl_dc_decision_status ON asset_declarations(dc_decision_status);
CREATE INDEX idx_decl_phys_verif_status ON asset_declarations(physical_verification_status);

-- ─── PHYSICAL VERIFICATION HISTORY ───────────────────────────────────────────
-- Append-only audit table for physical verification status changes.
-- Visible ONLY to DC. Never to Temple Authority.

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Append-only physical verification audit trail. DC-only. Never visible to Temple Authority.';
