-- V36: Update contractors table with enums and multiple documents support
-- Author: System
-- Date: 2026-04-21

-- Step 1: Add new column for multiple document IDs
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS document_ids TEXT;

-- Step 2: Migrate existing document_id to document_ids
UPDATE contractors 
SET document_ids = CAST(document_id AS TEXT) 
WHERE document_id IS NOT NULL AND (document_ids IS NULL OR document_ids = '');

-- Step 3: Update service_type to use enum values (convert existing data)
-- Map common variations to enum values
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

-- Step 4: Update payment_status to use enum values
UPDATE contractors SET payment_status = 'PENDING' 
WHERE UPPER(payment_status) IN ('PENDING', 'UNPAID', 'DUE', 'OUTSTANDING');

UPDATE contractors SET payment_status = 'COMPLETED' 
WHERE UPPER(payment_status) IN ('COMPLETED', 'PAID', 'DONE', 'FINISHED', 'COMPLETE');

UPDATE contractors SET payment_status = 'DISPUTED' 
WHERE UPPER(payment_status) IN ('DISPUTED', 'DISPUTE', 'ISSUE', 'PROBLEM');

UPDATE contractors SET payment_status = 'PENDING' 
WHERE payment_status IS NOT NULL 
AND payment_status NOT IN ('PENDING', 'COMPLETED', 'DISPUTED');

-- Step 5: Add comments for documentation
COMMENT ON COLUMN contractors.service_type IS 'Type of service: CIVIL_WORKS, ELECTRICAL, SECURITY, CATERING, EVENTS, OTHER';
COMMENT ON COLUMN contractors.payment_status IS 'Payment status: PENDING, COMPLETED, DISPUTED';
COMMENT ON COLUMN contractors.document_ids IS 'Comma-separated list of document IDs for contract files';

-- Step 6: Create index on service_type and payment_status for filtering
CREATE INDEX IF NOT EXISTS idx_contractors_service_type ON contractors(service_type) WHERE service_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contractors_payment_status ON contractors(payment_status) WHERE payment_status IS NOT NULL;

-- Note: We keep document_id column for backward compatibility but use document_ids going forward
