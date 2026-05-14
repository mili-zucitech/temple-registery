-- =============================================================================
-- CONTRACTOR SEED — Work Orders for ~35% of Temples
-- Standalone script: run AFTER temple_seed.sql
-- Idempotent: NOT EXISTS guards per temple.
--
-- Coverage:
--   Primary contractor  : temples where id % 3 IN (0,1)  ≈ 67% population
--   Filtered by LIMIT   : capped at ~360 records
--   Secondary contractor: Grade A temples with significant works  ≈ 90 records
--   Total               : ~450 contractor records across ~35% of temples
--
-- contractor.name maps to entity @Column(name="name") added by Hibernate
-- (V6 created company_name; entity field 'name' was Hibernate auto-added)
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET @sys = 1;
SET @ts  = NOW();

-- =============================================================================
-- SECTION 1: PRIMARY CONTRACTORS (one per ~35% of temples)
-- =============================================================================
INSERT INTO contractors (
    temple_id, name, gst_number, service_type,
    contract_reference, work_order_date, contract_start_date, contract_end_date,
    contract_value, payment_status,
    is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    t.id,

    -- Company name (10 rotating authentic firm names)
    CONCAT(ELT(1 + (t.id % 10),
        'Sri Constructions',            'Narayana Engineering Works',
        'Gopala Builders',              'Rangaswamy Contractors',
        'Venkataramaiah Projects',      'Srinivasa Infra',
        'Karnataka Heritage Builders',  'Raghavendra Construction',
        'Cauvery Engineering',          'Tungabhadra Buildcon'),
        ' Pvt Ltd') AS name,

    -- GST (Karnataka prefix 29, dummy format AABCXXXXX#Z#)
    CONCAT('29AABCT', LPAD(t.id, 5, '0'), 'Z', (1 + t.id % 9)) AS gst_number,

    -- Service type
    ELT(1 + (t.id % 10),
        'Temple Gopura Renovation',      'Compound Wall Construction',
        'Flooring & Tile Work',          'Electrical Rewiring',
        'Plumbing & Drainage',           'Painting & Waterproofing',
        'Solar Panel Installation',      'CCTV & Security Systems',
        'Structural Repair & Retrofit',  'Landscaping & Garden Development')
                                                                AS service_type,

    CONCAT('WO-2023-', LPAD(t.id, 6, '0'))                     AS contract_reference,
    DATE_SUB(CURDATE(), INTERVAL (t.id % 500 + 60) DAY)        AS work_order_date,
    DATE_SUB(CURDATE(), INTERVAL (t.id % 450 + 30) DAY)        AS contract_start_date,
    DATE_ADD(CURDATE(), INTERVAL (t.id % 365 + 30) DAY)        AS contract_end_date,

    -- Contract value scaled by grade
    CASE t.grade
        WHEN 'A' THEN ROUND((t.id % 80 + 10) * 100000, 2)
        WHEN 'B' THEN ROUND((t.id % 50 + 5)  *  50000, 2)
        ELSE          ROUND((t.id % 30 + 2)  *  25000, 2)
    END                                                         AS contract_value,

    ELT(1 + (t.id % 4), 'PAID', 'PARTIAL', 'PARTIAL', 'PENDING')
                                                                AS payment_status,

    0, @ts, @ts, @sys, @sys
FROM temples t
WHERE t.id % 3 IN (0, 1)
  AND t.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM contractors c WHERE c.temple_id = t.id AND c.is_deleted = 0
    )
LIMIT 360;

-- =============================================================================
-- SECTION 2: SECONDARY CONTRACTORS (Grade A temples — major projects)
-- =============================================================================
INSERT INTO contractors (
    temple_id, name, gst_number, service_type,
    contract_reference, work_order_date, contract_start_date, contract_end_date,
    contract_value, payment_status,
    is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    t.id,
    CONCAT(ELT(1 + (t.id % 6),
        'Heritage Restoration Services',  'Ancient Monuments Associates',
        'Shilpa Kala Enterprises',        'Vasudeva Construction',
        'Aacharya Infrastructure',        'Dharma Heritage Projects'),
        ' Pvt Ltd') AS name,
    CONCAT('29BBATR', LPAD(t.id, 5, '0'), 'Z', (1 + t.id % 9)) AS gst_number,
    ELT(1 + (t.id % 5),
        'Gopura Restoration & Conservation',
        'Kalyana Mantapa Construction',
        'Museum & Heritage Gallery',
        'Dharmasala Complex',
        'Water Tank & Pushkarini Renovation') AS service_type,
    CONCAT('WO-2024-', LPAD(t.id + 5000, 6, '0')),
    DATE_SUB(CURDATE(), INTERVAL (t.id % 200 + 10) DAY),
    DATE_SUB(CURDATE(), INTERVAL (t.id % 180 + 5)  DAY),
    DATE_ADD(CURDATE(), INTERVAL (t.id % 400 + 60) DAY),
    ROUND((t.id % 100 + 20) * 250000, 2) AS contract_value,
    ELT(1 + (t.id % 3), 'PAID', 'PARTIAL', 'PENDING'),
    0, @ts, @ts, @sys, @sys
FROM temples t
WHERE t.grade = 'A' AND t.is_deleted = 0
  AND (SELECT COUNT(*) FROM contractors c WHERE c.temple_id = t.id AND c.is_deleted = 0) < 2
LIMIT 90;

-- =============================================================================
-- SECTION 3: ELECTRICAL / UTILITY CONTRACTORS (Grade B temples, 50%)
-- =============================================================================
INSERT INTO contractors (
    temple_id, name, gst_number, service_type,
    contract_reference, work_order_date, contract_start_date, contract_end_date,
    contract_value, payment_status,
    is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    t.id,
    CONCAT(ELT(1 + (t.id % 5),
        'Rajashree Electricals',     'Veda Power Solutions',
        'Kiran Electrical Contractors','Surya Power Services',
        'Bharat Electricals'),
        ' Pvt Ltd') AS name,
    CONCAT('29CBELX', LPAD(t.id, 5, '0'), 'Z', (1 + t.id % 9)),
    ELT(1 + (t.id % 4),
        'Electrical Panel Upgrade',
        'LED Lighting Installation',
        'Generator & UPS Setup',
        'Solar Power Grid Connection'),
    CONCAT('WO-2024-ELEC-', LPAD(t.id, 5, '0')),
    DATE_SUB(CURDATE(), INTERVAL (t.id % 100 + 10) DAY),
    DATE_SUB(CURDATE(), INTERVAL (t.id % 90  +  5) DAY),
    DATE_ADD(CURDATE(), INTERVAL (t.id % 90  + 30) DAY),
    ROUND((t.id % 20 + 3) * 15000, 2),
    ELT(1 + (t.id % 3), 'PAID', 'PAID', 'PARTIAL'),
    0, @ts, @ts, @sys, @sys
FROM temples t
WHERE t.grade = 'B' AND t.id % 2 = 0 AND t.is_deleted = 0
  AND (SELECT COUNT(*) FROM contractors c WHERE c.temple_id = t.id AND c.is_deleted = 0) < 2
LIMIT 60;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- Verification:
-- SELECT COUNT(*) FROM contractors WHERE is_deleted=0;
-- SELECT COUNT(DISTINCT temple_id) FROM contractors WHERE is_deleted=0;
-- SELECT payment_status, COUNT(*) FROM contractors WHERE is_deleted=0 GROUP BY payment_status;
-- =============================================================================
