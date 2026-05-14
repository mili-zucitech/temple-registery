-- =============================================================================
-- DOCUMENTS SEED — 4-5 Documents per Temple
-- Standalone script: run AFTER temple_seed.sql and trust_seed.sql
-- Idempotent: NOT EXISTS guards per (owner_type, owner_id, document_label).
--
-- Documents table stores file metadata; actual files are on disk/S3.
-- owner_type values: 'TEMPLE' | 'TRUST' | 'DECLARATION' | 'CONTRACTOR'
--
-- Document types per temple:
--   1. Registration Certificate   (all temples)
--   2. Land Document              (all temples)
--   3. Trust Deed                 (trust_registered=1 only)
--   4. Audit Report 2024-25       (APPROVED + PENDING declarations)
--   5. Annual Income Statement    (Grade A temples)
--   6. Contractor Agreement       (temples with contractors)
--
-- Plus trust-level and declaration-level documents.
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET @sys = 1;
SET @ts  = NOW();

-- =============================================================================
-- SECTION 1: REGISTRATION CERTIFICATES (all 1 020 temples)
-- =============================================================================
INSERT INTO documents (
    owner_type, owner_id, original_filename, s3_key,
    mime_type, file_size_bytes, document_label,
    is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    'TEMPLE', t.id,
    CONCAT('RegistrationCertificate_', t.registration_number, '.pdf'),
    CONCAT('temples/', t.id, '/official/registration_cert.pdf'),
    'application/pdf',
    ROUND(45000 + (t.id % 100) * 850),
    'Registration Certificate',
    0, t.created_at, t.created_at, @sys, @sys
FROM temples t
WHERE t.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM documents d
        WHERE d.owner_type = 'TEMPLE' AND d.owner_id = t.id
          AND d.document_label = 'Registration Certificate'
    );

-- =============================================================================
-- SECTION 2: LAND DOCUMENTS (all temples)
-- =============================================================================
INSERT INTO documents (
    owner_type, owner_id, original_filename, s3_key,
    mime_type, file_size_bytes, document_label,
    is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    'TEMPLE', t.id,
    CONCAT('LandPossessionCertificate_', t.registration_number, '.pdf'),
    CONCAT('temples/', t.id, '/official/land_document.pdf'),
    'application/pdf',
    ROUND(85000 + (t.id % 60) * 2000),
    'Land Document',
    0, t.created_at, t.created_at, @sys, @sys
FROM temples t
WHERE t.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM documents d
        WHERE d.owner_type = 'TEMPLE' AND d.owner_id = t.id
          AND d.document_label = 'Land Document'
    );

-- =============================================================================
-- SECTION 3: TRUST DEEDS (trust_registered=1 temples)
-- =============================================================================
INSERT INTO documents (
    owner_type, owner_id, original_filename, s3_key,
    mime_type, file_size_bytes, document_label,
    is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    'TEMPLE', t.id,
    CONCAT('TrustDeed_', t.registration_number, '.pdf'),
    CONCAT('temples/', t.id, '/trust/trust_deed.pdf'),
    'application/pdf',
    ROUND(65000 + (t.id % 70) * 1500),
    'Trust Deed',
    0, t.created_at, t.created_at, @sys, @sys
FROM temples t
WHERE t.trust_registered = 1 AND t.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM documents d
        WHERE d.owner_type = 'TEMPLE' AND d.owner_id = t.id
          AND d.document_label = 'Trust Deed'
    );

-- =============================================================================
-- SECTION 4: AUDIT REPORTS FY 2024-25 (APPROVED + PENDING declarations)
-- =============================================================================
INSERT INTO documents (
    owner_type, owner_id, original_filename, s3_key,
    mime_type, file_size_bytes, document_label,
    is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    'TEMPLE', t.id,
    CONCAT('AuditReport_FY2024-25_', t.registration_number, '.pdf'),
    CONCAT('temples/', t.id, '/financial/audit_report_2024_25.pdf'),
    'application/pdf',
    ROUND(110000 + (t.id % 80) * 3000),
    'Audit Report 2024-25',
    0, @ts, @ts, @sys, @sys
FROM temples t
WHERE t.asset_declaration_status IN ('APPROVED', 'PENDING_REVIEW')
  AND t.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM documents d
        WHERE d.owner_type = 'TEMPLE' AND d.owner_id = t.id
          AND d.document_label = 'Audit Report 2024-25'
    );

-- =============================================================================
-- SECTION 5: ANNUAL INCOME STATEMENT (Grade A temples)
-- =============================================================================
INSERT INTO documents (
    owner_type, owner_id, original_filename, s3_key,
    mime_type, file_size_bytes, document_label,
    is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    'TEMPLE', t.id,
    CONCAT('AnnualIncomeStatement_FY2024-25_', t.registration_number, '.pdf'),
    CONCAT('temples/', t.id, '/financial/income_statement_2024_25.pdf'),
    'application/pdf',
    ROUND(55000 + (t.id % 40) * 2000),
    'Annual Income Statement 2024-25',
    0, @ts, @ts, @sys, @sys
FROM temples t
WHERE t.grade = 'A' AND t.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM documents d
        WHERE d.owner_type = 'TEMPLE' AND d.owner_id = t.id
          AND d.document_label = 'Annual Income Statement 2024-25'
    );

-- =============================================================================
-- SECTION 6: CONTRACTOR AGREEMENTS (temples with active contractors)
-- =============================================================================
INSERT INTO documents (
    owner_type, owner_id, original_filename, s3_key,
    mime_type, file_size_bytes, document_label,
    is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT DISTINCT
    'TEMPLE', c.temple_id,
    CONCAT('ContractorAgreement_', t.registration_number, '.pdf'),
    CONCAT('temples/', c.temple_id, '/contracts/contractor_agreement.pdf'),
    'application/pdf',
    ROUND(38000 + (c.temple_id % 40) * 1000),
    'Contractor Agreement',
    0, @ts, @ts, @sys, @sys
FROM contractors c
JOIN temples t ON t.id = c.temple_id
WHERE c.is_deleted = 0 AND t.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM documents d
        WHERE d.owner_type = 'TEMPLE' AND d.owner_id = c.temple_id
          AND d.document_label = 'Contractor Agreement'
    );

-- =============================================================================
-- SECTION 7: WORK ORDER DOCUMENTS (one per contractor record)
-- owner_type='CONTRACTOR', owner_id=contractor.id
-- =============================================================================
INSERT INTO documents (
    owner_type, owner_id, original_filename, s3_key,
    mime_type, file_size_bytes, document_label,
    is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    'CONTRACTOR', c.id,
    CONCAT('WorkOrder_', COALESCE(c.contract_reference, CONCAT('WO-', c.id)), '.pdf'),
    CONCAT('contractors/', c.id, '/work_order.pdf'),
    'application/pdf',
    ROUND(25000 + (c.id % 30) * 800),
    'Work Order',
    0, @ts, @ts, @sys, @sys
FROM contractors c
WHERE c.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM documents d
        WHERE d.owner_type = 'CONTRACTOR' AND d.owner_id = c.id
          AND d.document_label = 'Work Order'
    );

-- =============================================================================
-- SECTION 8: TRUST REGISTRATION DOCUMENTS
-- owner_type='TRUST', owner_id=trust_registrations.id
-- =============================================================================
INSERT INTO documents (
    owner_type, owner_id, original_filename, s3_key,
    mime_type, file_size_bytes, document_label,
    is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    'TRUST', tr.id,
    CONCAT('TrustRegistrationCertificate_', tr.registration_number, '.pdf'),
    CONCAT('trusts/', tr.id, '/registration_cert.pdf'),
    'application/pdf',
    ROUND(50000 + (tr.id % 50) * 1200),
    'Trust Registration Certificate',
    0, tr.created_at, tr.created_at, @sys, @sys
FROM trust_registrations tr
WHERE tr.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM documents d
        WHERE d.owner_type = 'TRUST' AND d.owner_id = tr.id
          AND d.document_label = 'Trust Registration Certificate'
    );

-- =============================================================================
-- SECTION 9: PAN DOCUMENTS FOR TRUSTS (Grade A temple trusts)
-- =============================================================================
INSERT INTO documents (
    owner_type, owner_id, original_filename, s3_key,
    mime_type, file_size_bytes, document_label,
    is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    'TRUST', tr.id,
    CONCAT('PAN_', tr.registration_number, '.pdf'),
    CONCAT('trusts/', tr.id, '/pan_certificate.pdf'),
    'application/pdf',
    ROUND(12000 + (tr.id % 20) * 500),
    'PAN Certificate',
    0, tr.created_at, tr.created_at, @sys, @sys
FROM trust_registrations tr
JOIN temples t ON t.id = tr.temple_id
WHERE t.grade = 'A' AND tr.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM documents d
        WHERE d.owner_type = 'TRUST' AND d.owner_id = tr.id
          AND d.document_label = 'PAN Certificate'
    );

-- =============================================================================
-- SECTION 10: DECLARATION ACKNOWLEDGEMENTS (APPROVED declarations)
-- owner_type='DECLARATION', owner_id=asset_declarations.id
-- =============================================================================
INSERT INTO documents (
    owner_type, owner_id, original_filename, s3_key,
    mime_type, file_size_bytes, document_label,
    is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    'DECLARATION', ad.id,
    CONCAT('Acknowledgement_', ad.acknowledgement_number, '.pdf'),
    CONCAT('declarations/', ad.id, '/acknowledgement.pdf'),
    'application/pdf',
    ROUND(18000 + (ad.id % 20) * 400),
    'Acknowledgement Letter',
    0, ad.reviewed_at, ad.reviewed_at, @sys, @sys
FROM asset_declarations ad
WHERE ad.status = 'APPROVED'
  AND ad.acknowledgement_number IS NOT NULL
  AND ad.reviewed_at IS NOT NULL
  AND ad.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM documents d
        WHERE d.owner_type = 'DECLARATION' AND d.owner_id = ad.id
          AND d.document_label = 'Acknowledgement Letter'
    );

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- Verification:
-- SELECT owner_type, document_label, COUNT(*) FROM documents WHERE is_deleted=0
--   GROUP BY owner_type, document_label ORDER BY owner_type, document_label;
-- SELECT COUNT(DISTINCT owner_id) FROM documents WHERE owner_type='TEMPLE' AND is_deleted=0;
--   (should be ≥ 1020)
-- =============================================================================
