-- ============================================================
-- V36: Merged migration (resolves duplicate V36 conflict)
--   1. V36__remove_governance_columns_from_staff_contractors.sql
--   2. V36__update_contractor_enums.sql
-- DROP operations first, then ADD operations.
-- ============================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1: Remove DC approval workflow columns from employees and contractors
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── EMPLOYEES ───────────────────────────────────────────────────────────────

DROP INDEX IF EXISTS idx_employees_submission_status ON employees;
DROP INDEX IF EXISTS idx_employees_dc_decision_status ON employees;

ALTER TABLE employees
    DROP COLUMN IF EXISTS submission_status,
    DROP COLUMN IF EXISTS system_verification_status,
    DROP COLUMN IF EXISTS dc_decision_status,
    DROP COLUMN IF EXISTS send_back_reason,
    DROP COLUMN IF EXISTS governance_version;

-- ─── CONTRACTORS ─────────────────────────────────────────────────────────────

DROP INDEX IF EXISTS idx_contractors_submission_status ON contractors;
DROP INDEX IF EXISTS idx_contractors_dc_decision_status ON contractors;

ALTER TABLE contractors
    DROP COLUMN IF EXISTS submission_status,
    DROP COLUMN IF EXISTS system_verification_status,
    DROP COLUMN IF EXISTS dc_decision_status,
    DROP COLUMN IF EXISTS send_back_reason,
    DROP COLUMN IF EXISTS governance_version;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2: Update contractors table with enums and multiple documents support
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE contractors ADD COLUMN IF NOT EXISTS document_ids TEXT;

UPDATE contractors 
SET document_ids = CAST(document_id AS CHAR) 
WHERE document_id IS NOT NULL AND (document_ids IS NULL OR document_ids = '');

UPDATE contractors SET service_type = 'CIVIL_WORKS' 
WHERE UPPER(service_type) IN ('CIVIL', 'CONSTRUCTION', 'CIVIL WORKS', 'CIVIL_WORKS', 'RENOVATION');

UPDATE contractors SET service_type = 'ELECTRICAL' 
WHERE UPPER(service_type) IN ('ELECTRICAL', 'ELECTRIC', 'WIRING');

UPDATE contractors SET service_type = 'SECURITY' 
WHERE UPPER(service_type) IN ('SECURITY', 'GUARD', 'GUARDS');

UPDATE contractors SET service_type = 'CATERING' 
WHERE UPPER(service_type) IN ('CATERING', 'FOOD', 'KITCHEN');

UPDATE contractors SET service_type = 'EVENTS' 
WHERE UPPER(service_type) IN ('EVENTS', 'EVENT', 'CEREMONY', 'CEREMONIES');

UPDATE contractors SET service_type = 'OTHER' 
WHERE service_type IS NOT NULL 
AND service_type NOT IN ('CIVIL_WORKS', 'ELECTRICAL', 'SECURITY', 'CATERING', 'EVENTS');

UPDATE contractors SET payment_status = 'PENDING' 
WHERE UPPER(payment_status) IN ('PENDING', 'UNPAID', 'DUE', 'OUTSTANDING');

UPDATE contractors SET payment_status = 'COMPLETED' 
WHERE UPPER(payment_status) IN ('COMPLETED', 'PAID', 'DONE', 'FINISHED', 'COMPLETE');

UPDATE contractors SET payment_status = 'DISPUTED' 
WHERE UPPER(payment_status) IN ('DISPUTED', 'DISPUTE', 'ISSUE', 'PROBLEM');

UPDATE contractors SET payment_status = 'PENDING' 
WHERE payment_status IS NOT NULL 
AND payment_status NOT IN ('PENDING', 'COMPLETED', 'DISPUTED');

CREATE INDEX IF NOT EXISTS idx_contractors_service_type ON contractors(service_type);
CREATE INDEX IF NOT EXISTS idx_contractors_payment_status ON contractors(payment_status);
