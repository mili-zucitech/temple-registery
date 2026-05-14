-- =============================================================================
-- TRUST SEED — Trust Registrations, Board Members & Trust Financials
-- Standalone script: run AFTER temple_seed.sql
-- Idempotent: NOT EXISTS guards prevent duplicate inserts.
--
-- Coverage:
--   trust_registrations : ~70% of temples (trust_registered=1)
--   board_members        : 3 per trust (Chairperson + Treasurer + Member)
--   trust_financials     : FY 2024-25 per trust
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET @sys = 1;
SET @ts  = NOW();

-- =============================================================================
-- SECTION 1: TRUST REGISTRATIONS
-- One trust per temple where trust_registered = 1.
-- Uses entity-mapped column names (date_of_registration, registering_authority,
-- bank_branch, annual_income) as created by Hibernate ddl-auto=update.
-- =============================================================================
INSERT INTO trust_registrations (
    temple_id, trust_name, trust_type, registration_number,
    registering_authority, date_of_registration, bank_name, bank_branch,
    annual_income,
    is_deleted, created_at, updated_at, created_by, updated_by, version
)
SELECT
    t.id                                                        AS temple_id,
    CONCAT(t.name, ' Trust')                                    AS trust_name,
    IF(t.id % 2 = 0, 'PUBLIC', 'PRIVATE')                      AS trust_type,
    CONCAT('KTRT-', LPAD(t.id, 6, '0'))                        AS registration_number,

    -- Registering authority (district-mapped)
    CONCAT('Sub-Registrar, ',
        ELT(1 + (t.district_id % 10),
            'Mysuru', 'Mandya', 'Chamarajanagar', 'Madikeri', 'Hassan',
            'Bengaluru', 'Ramanagara', 'Tumkuru', 'Kolar', 'Kalaburagi'))
                                                                AS registering_authority,

    DATE_SUB(CURDATE(), INTERVAL (t.id % 22 + 1) YEAR)          AS date_of_registration,

    ELT(1 + (t.id % 7),
        'State Bank of India', 'Canara Bank', 'Karnataka Bank',
        'Union Bank of India', 'Bank of Baroda', 'Indian Bank',
        'Syndicate Bank')                                        AS bank_name,

    ELT(1 + (t.id % 7),
        'Main Branch Mysuru', 'Bengaluru City Branch', 'Dharwad Branch',
        'Kalaburagi Main Branch', 'Hubballi Branch',
        'Hassan City Branch', 'Mangaluru Branch')               AS bank_branch,

    -- Annual income scaled by grade
    CASE t.grade
        WHEN 'A' THEN ROUND(1500000 + (t.id % 80) * 50000, 2)
        WHEN 'B' THEN ROUND(300000  + (t.id % 60) * 10000, 2)
        ELSE          ROUND(50000   + (t.id % 40) *  5000, 2)
    END                                                         AS annual_income,

    0                                                           AS is_deleted,
    DATE_SUB(@ts, INTERVAL (t.id % 1800) DAY)                   AS created_at,
    DATE_SUB(@ts, INTERVAL (t.id %  365) DAY)                   AS updated_at,
    @sys                                                        AS created_by,
    @sys                                                        AS updated_by,
    0                                                           AS version
FROM temples t
WHERE t.trust_registered = 1
  AND t.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM trust_registrations tr WHERE tr.temple_id = t.id
    );

-- =============================================================================
-- SECTION 2: BOARD MEMBERS (3 per trust)
-- Chairperson · Treasurer · Member
-- Uses UNION ALL so a single pass populates all 3 roles atomically.
-- =============================================================================

-- Chairpersons
INSERT INTO board_members (
    trust_id, full_name, designation,
    appointment_date, tenure_end_date, contact_number,
    is_current, is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    tr.id,
    ELT(1 + (tr.id % 15),
        'Rama Rao',             'Gopala Krishnaswamy',  'Venkatesh Iyengar',
        'Narasimha Murthy',     'Srinivasa Acharya',    'Lakshmipathi Rao',
        'Rangaswamy Gowda',     'Anantha Raju',         'Subbanna Naidu',
        'Krishnaraj Wodeyar',   'Parameshwara Bhat',    'Shivaswamy',
        'Devaraja Urs',         'Channabassappa',       'Manjunatheswara') AS full_name,
    'Chairperson',
    DATE_SUB(CURDATE(), INTERVAL (tr.id % 6 + 1) YEAR),
    DATE_ADD(CURDATE(), INTERVAL (6 - tr.id % 6) YEAR),
    CONCAT('97', LPAD((tr.id * 11 + 1000000) % 100000000, 8, '0')),
    1, 0, @ts, @ts, @sys, @sys
FROM trust_registrations tr
WHERE tr.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM board_members bm
        WHERE bm.trust_id = tr.id AND bm.designation = 'Chairperson' AND bm.is_deleted = 0
    );

-- Treasurers
INSERT INTO board_members (
    trust_id, full_name, designation,
    appointment_date, tenure_end_date, contact_number,
    is_current, is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    tr.id,
    ELT(1 + (tr.id % 12),
        'Channabassavaiah',     'Nanjundaiah',           'Veereshwara Hegde',
        'Raghavendra Bhat',     'Suresh Kulkarni',       'Manjunatha Swamy',
        'Prasanna Kumar',       'Shivananda Rao',        'Basavaraja',
        'Channappa Gowda',      'Ningarajappa',          'Somashekhar') AS full_name,
    'Treasurer',
    DATE_SUB(CURDATE(), INTERVAL (tr.id % 5 + 1) YEAR),
    DATE_ADD(CURDATE(), INTERVAL (5 - tr.id % 5) YEAR),
    CONCAT('98', LPAD((tr.id * 13 + 2000000) % 100000000, 8, '0')),
    1, 0, @ts, @ts, @sys, @sys
FROM trust_registrations tr
WHERE tr.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM board_members bm
        WHERE bm.trust_id = tr.id AND bm.designation = 'Treasurer' AND bm.is_deleted = 0
    );

-- Members
INSERT INTO board_members (
    trust_id, full_name, designation,
    appointment_date, tenure_end_date, contact_number,
    is_current, is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    tr.id,
    ELT(1 + (tr.id % 10),
        'Lokesh Kumar',     'Venkataraman',     'Shivalingappa',
        'Devaraja Urs',     'Nagabhushan',      'Ramachandraiah',
        'Siddaramappa',     'Thimmappa',        'Krishnaswamy',
        'Veeranna Gowda') AS full_name,
    'Member',
    DATE_SUB(CURDATE(), INTERVAL (tr.id % 4 + 1) YEAR),
    DATE_ADD(CURDATE(), INTERVAL (4 - tr.id % 4) YEAR),
    CONCAT('96', LPAD((tr.id * 17 + 3000000) % 100000000, 8, '0')),
    1, 0, @ts, @ts, @sys, @sys
FROM trust_registrations tr
WHERE tr.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM board_members bm
        WHERE bm.trust_id = tr.id AND bm.designation = 'Member' AND bm.is_deleted = 0
    );

-- Additional member for Grade A trusts (4 board members total)
INSERT INTO board_members (
    trust_id, full_name, designation,
    appointment_date, tenure_end_date, contact_number,
    is_current, is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    tr.id,
    ELT(1 + (tr.id % 8),
        'Mallikarjuna Swamy',   'Virupaksha Rao',   'Somashekharaiah',
        'Puttaswamy Gowda',     'Thimmakka',        'Lakshmamma',
        'Venkatalakshmi',       'Shakuntala Devi') AS full_name,
    'Deputy Member',
    DATE_SUB(CURDATE(), INTERVAL (tr.id % 3 + 1) YEAR),
    DATE_ADD(CURDATE(), INTERVAL (3 - tr.id % 3) YEAR),
    CONCAT('95', LPAD((tr.id * 19 + 4000000) % 100000000, 8, '0')),
    1, 0, @ts, @ts, @sys, @sys
FROM trust_registrations tr
JOIN temples t ON t.id = tr.temple_id
WHERE t.grade = 'A' AND tr.is_deleted = 0
  AND (SELECT COUNT(*) FROM board_members bm
       WHERE bm.trust_id = tr.id AND bm.is_deleted = 0) < 4;

-- =============================================================================
-- SECTION 3: BOARD MEETINGS (last annual meeting per trust)
-- =============================================================================
INSERT INTO board_meetings (
    trust_id, meeting_date, agenda,
    is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    tr.id,
    DATE_SUB(CURDATE(), INTERVAL (tr.id % 180 + 30) DAY) AS meeting_date,
    CONCAT('Annual review for FY 2024-25. ',
        ELT(1 + (tr.id % 4),
            'Agenda: Budget approval, staff increments, maintenance works.',
            'Agenda: Trust accounts review, festival budget, property inspection.',
            'Agenda: Annual general body meeting, election of office bearers.',
            'Agenda: Compliance with HR&CE Act, contractor payments review.')),
    0, @ts, @ts, @sys, @sys
FROM trust_registrations tr
WHERE tr.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM board_meetings bm WHERE bm.trust_id = tr.id AND bm.is_deleted = 0
    );

-- =============================================================================
-- SECTION 4: TRUST FINANCIALS (FY 2024-25 per trust)
-- =============================================================================
INSERT IGNORE INTO trust_financials (
    trust_id, financial_year,
    total_income, total_expenditure, surplus_deficit,
    auditor_name, audit_date, remarks,
    is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    tr.id,
    '2024-25',
    ROUND((tr.id * 12345.67) % 5000000 + 100000, 2)  AS total_income,
    ROUND((tr.id *  9876.54) % 4000000 +  80000, 2)  AS total_expenditure,
    ROUND(
        ((tr.id * 12345.67) % 5000000 + 100000) -
        ((tr.id *  9876.54) % 4000000 +  80000), 2)  AS surplus_deficit,
    ELT(1 + (tr.id % 8),
        'K Ramaiah & Associates',    'Narayana & Co',
        'Srinivasa Audit Firm',      'Rao & Partners',
        'Krishnamurthy Auditors',    'Venkataramaiah CPA',
        'B M Hegde & Co',            'Channappa Audit Services') AS auditor_name,
    DATE_SUB(CURDATE(), INTERVAL (tr.id % 90) DAY) AS audit_date,
    CONCAT('Annual audit for FY 2024-25 completed. ',
        CASE WHEN ((tr.id * 12345.67) % 5000000 + 100000) >
                  ((tr.id *  9876.54) % 4000000 +  80000)
             THEN 'Accounts show surplus. Recommended for carryforward.'
             ELSE 'Deficit noted. Remediation plan submitted to DC office.' END) AS remarks,
    0, @ts, @ts, @sys, @sys
FROM trust_registrations tr
WHERE tr.is_deleted = 0;

-- Also add FY 2023-24 historical financials for Grade A trusts
INSERT IGNORE INTO trust_financials (
    trust_id, financial_year,
    total_income, total_expenditure, surplus_deficit,
    auditor_name, audit_date, remarks,
    is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    tr.id,
    '2023-24',
    ROUND((tr.id * 11111.11) % 4500000 + 90000, 2),
    ROUND((tr.id *  8888.88) % 3500000 + 70000, 2),
    ROUND(
        ((tr.id * 11111.11) % 4500000 + 90000) -
        ((tr.id *  8888.88) % 3500000 + 70000), 2),
    ELT(1 + (tr.id % 4),
        'K Ramaiah & Associates', 'Narayana & Co',
        'Srinivasa Audit Firm',   'Krishnamurthy Auditors'),
    DATE_SUB(CURDATE(), INTERVAL (tr.id % 90 + 365) DAY),
    'Annual audit for FY 2023-24 completed.',
    0, @ts, @ts, @sys, @sys
FROM trust_registrations tr
JOIN temples t ON t.id = tr.temple_id
WHERE t.grade = 'A' AND tr.is_deleted = 0;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- Verification:
-- SELECT COUNT(*) FROM trust_registrations WHERE is_deleted=0;
-- SELECT COUNT(*) FROM board_members WHERE is_deleted=0;
-- SELECT COUNT(*) FROM trust_financials WHERE is_deleted=0;
-- =============================================================================
