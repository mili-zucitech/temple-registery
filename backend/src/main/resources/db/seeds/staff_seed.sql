-- =============================================================================
-- STAFF SEED — Comprehensive Employee Records
-- Standalone script: run AFTER temple_seed.sql
-- Idempotent: NOT EXISTS guards per (temple_id, employee_type, designation).
--
-- Coverage per temple (by grade):
--   Grade A: Head Priest + Asst Priest + Admin Officer + Accounts Asst
--            + Security Guard x2 + Maintenance x2  (min 8 staff)
--   Grade B: Head Priest + Admin Officer + Security Guard + Maintenance
--            (min 4 staff; Asst Priest added too = 5)
--   Grade C: Head Priest + Admin Officer + Security Guard + Maintenance
--            (min 4 staff)
--
-- EmployeeType enum: PRIEST | ADMINISTRATIVE | SECURITY | MAINTENANCE
-- EmployeeStatus enum: ACTIVE | ON_LEAVE | RETIRED | RESIGNED
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET @sys = 1;
SET @ts  = NOW();

-- =============================================================================
-- SECTION 1: HEAD PRIEST (all temples)
-- =============================================================================
INSERT INTO employees (
    temple_id, employee_ref, full_name, employee_type, designation,
    date_of_joining, salary_grade, mobile, address, is_hereditary,
    status, is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    t.id,
    CONCAT('EMP-', LPAD(t.id, 6, '0'), '-PR1'),
    ELT(1 + (t.id % 20),
        'Anantha Sharma',      'Narayanacharya',       'Raghavendra Bhat',
        'Srinivasa Jois',      'Venkatesh Dikshit',    'Lakshmipathi Bhat',
        'Subrahmanya Acharya', 'Rangaswamy Dikshit',   'Krishnamurthy Bhat',
        'Vishwanatha Sharma',  'Parameshwara Jois',    'Narasimhacharya',
        'Ramachandra Hegde',   'Sunder Bhat',          'Gopal Dikshit',
        'Prasad Sharma',       'Nanjunda Dikshit',     'Srikanth Jois',
        'Manjunath Bhat',      'Shankara Acharya')     AS full_name,
    'PRIEST',
    'Head Priest',
    DATE_SUB(CURDATE(), INTERVAL (t.id % 20 + 2) YEAR) AS date_of_joining,
    CASE t.grade WHEN 'A' THEN 'L5' WHEN 'B' THEN 'L3' ELSE 'L2' END AS salary_grade,
    CONCAT('94', LPAD((t.id * 11 + 4000000) % 100000000, 8, '0')),
    CONCAT('Temple Quarters, ', COALESCE(t.village_town, 'Mysuru'), ', Karnataka - ',
           COALESCE(t.pin_code, '570001')),
    (t.id % 3 = 0)   AS is_hereditary,
    'ACTIVE',
    0, @ts, @ts, @sys, @sys
FROM temples t
WHERE t.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM employees e
        WHERE e.temple_id = t.id AND e.employee_type = 'PRIEST'
          AND e.designation = 'Head Priest' AND e.is_deleted = 0
    );

-- =============================================================================
-- SECTION 2: ASSISTANT PRIEST (Grade A and B temples)
-- =============================================================================
INSERT INTO employees (
    temple_id, employee_ref, full_name, employee_type, designation,
    date_of_joining, salary_grade, mobile, address, is_hereditary,
    status, is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    t.id,
    CONCAT('EMP-', LPAD(t.id, 6, '0'), '-PR2'),
    ELT(1 + (t.id % 16),
        'Ramachandra Bhat',  'Suresh Jois',       'Gopal Dikshit',
        'Madhu Acharya',     'Venkataramana',     'Sunder Bhat',
        'Nanjunda Dikshit',  'Prasad Sharma',     'Srikanth Jois',
        'Manjunath Bhat',    'Shankara Acharya',  'Venkataraya Bhat',
        'Narayana Jois',     'Subramanya Dikshit','Ganapati Bhat',
        'Ananda Acharya')    AS full_name,
    'PRIEST',
    'Assistant Priest',
    DATE_SUB(CURDATE(), INTERVAL (t.id % 10 + 1) YEAR),
    CASE t.grade WHEN 'A' THEN 'L4' ELSE 'L2' END,
    CONCAT('95', LPAD((t.id * 13 + 5000000) % 100000000, 8, '0')),
    CONCAT('Agrahara Colony, ', COALESCE(t.village_town, 'Mysuru'), ', Karnataka'),
    (t.id % 4 = 0),
    'ACTIVE',
    0, @ts, @ts, @sys, @sys
FROM temples t
WHERE t.grade IN ('A', 'B') AND t.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM employees e
        WHERE e.temple_id = t.id AND e.employee_type = 'PRIEST'
          AND e.designation = 'Assistant Priest' AND e.is_deleted = 0
    );

-- =============================================================================
-- SECTION 3: SECOND ASSISTANT PRIEST (Grade A temples only)
-- =============================================================================
INSERT INTO employees (
    temple_id, employee_ref, full_name, employee_type, designation,
    date_of_joining, salary_grade, mobile, address, is_hereditary,
    status, is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    t.id,
    CONCAT('EMP-', LPAD(t.id, 6, '0'), '-PR3'),
    ELT(1 + (t.id % 10),
        'Srinivasa Bhatta',  'Venkatarama Jois', 'Lakshmi Narayan',
        'Krishna Bhat',      'Shiva Bhat',       'Vishnu Acharya',
        'Brahma Dikshit',    'Rudra Sharma',     'Indira Bhat',
        'Vayu Jois')         AS full_name,
    'PRIEST',
    'Junior Priest',
    DATE_SUB(CURDATE(), INTERVAL (t.id % 6 + 1) YEAR),
    'L3',
    CONCAT('93', LPAD((t.id * 7 + 6000000) % 100000000, 8, '0')),
    CONCAT('Temple Road, ', COALESCE(t.village_town, 'Mysuru'), ', Karnataka'),
    0,
    'ACTIVE',
    0, @ts, @ts, @sys, @sys
FROM temples t
WHERE t.grade = 'A' AND t.is_deleted = 0
  AND (SELECT COUNT(*) FROM employees e
       WHERE e.temple_id = t.id AND e.employee_type = 'PRIEST' AND e.is_deleted = 0) < 3;

-- =============================================================================
-- SECTION 4: ADMINISTRATIVE OFFICER (all temples)
-- =============================================================================
INSERT INTO employees (
    temple_id, employee_ref, full_name, employee_type, designation,
    date_of_joining, salary_grade, mobile, address, is_hereditary,
    status, is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    t.id,
    CONCAT('EMP-', LPAD(t.id, 6, '0'), '-AD1'),
    ELT(1 + (t.id % 16),
        'Manjunatha Gowda',  'Suresh Kumar',      'Ravi Shankar',
        'Prasanna Kumar',    'Nagaraja Reddy',    'Channappa',
        'Thirumala Rao',     'Devaraja',          'Siddappa Nayak',
        'Ramappa Wali',      'Krishnappa Hegde',  'Basavaiah',
        'Shivarudrappa',     'Mallesha',          'Puttaswamy',
        'Hoovaiah')          AS full_name,
    'ADMINISTRATIVE',
    ELT(1 + (t.id % 3), 'Executive Officer', 'Accounts Officer', 'Office Manager'),
    DATE_SUB(CURDATE(), INTERVAL (t.id % 12 + 1) YEAR),
    CASE t.grade WHEN 'A' THEN 'L4' WHEN 'B' THEN 'L3' ELSE 'L2' END,
    CONCAT('99', LPAD((t.id * 9 + 5000000) % 100000000, 8, '0')),
    CONCAT('Staff Quarters, ', COALESCE(t.village_town, 'Mysuru'), ', Karnataka'),
    0,
    'ACTIVE',
    0, @ts, @ts, @sys, @sys
FROM temples t
WHERE t.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM employees e
        WHERE e.temple_id = t.id AND e.employee_type = 'ADMINISTRATIVE'
          AND e.designation IN ('Executive Officer','Accounts Officer','Office Manager')
          AND e.is_deleted = 0
    );

-- =============================================================================
-- SECTION 5: ACCOUNTS ASSISTANT (Grade A and B temples)
-- =============================================================================
INSERT INTO employees (
    temple_id, employee_ref, full_name, employee_type, designation,
    date_of_joining, salary_grade, mobile, address, is_hereditary,
    status, is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    t.id,
    CONCAT('EMP-', LPAD(t.id, 6, '0'), '-AD2'),
    ELT(1 + (t.id % 12),
        'Latha Devi',        'Radha Kumari',      'Savithri',
        'Padmavathi',        'Lalitha',           'Ambika',
        'Nirmala',           'Jayalakshmi',       'Kamakshi',
        'Mangalamma',        'Thayamma',          'Hemalatha') AS full_name,
    'ADMINISTRATIVE',
    'Accounts Assistant',
    DATE_SUB(CURDATE(), INTERVAL (t.id % 8 + 1) YEAR),
    CASE t.grade WHEN 'A' THEN 'L3' ELSE 'L2' END,
    CONCAT('91', LPAD((t.id * 17 + 7000000) % 100000000, 8, '0')),
    CONCAT('Nearby Layout, ', COALESCE(t.village_town, 'Mysuru'), ', Karnataka'),
    0,
    'ACTIVE',
    0, @ts, @ts, @sys, @sys
FROM temples t
WHERE t.grade IN ('A', 'B') AND t.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM employees e
        WHERE e.temple_id = t.id AND e.employee_type = 'ADMINISTRATIVE'
          AND e.designation = 'Accounts Assistant' AND e.is_deleted = 0
    );

-- =============================================================================
-- SECTION 6: PRIMARY SECURITY GUARD (all temples)
-- =============================================================================
INSERT INTO employees (
    temple_id, employee_ref, full_name, employee_type, designation,
    date_of_joining, salary_grade, mobile, address, is_hereditary,
    status, is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    t.id,
    CONCAT('EMP-', LPAD(t.id, 6, '0'), '-SE1'),
    ELT(1 + (t.id % 16),
        'Basavaiah',     'Mahadevaiah',   'Krishnappa',    'Thimmaiah',
        'Veerappa',      'Nanjappa',      'Muniraju',      'Siddappa',
        'Ramaiah',       'Lokaiah',       'Shivanna',      'Channanna',
        'Gundappa',      'Eranna',        'Hanumanthappa', 'Mariappa') AS full_name,
    'SECURITY',
    'Security Guard',
    DATE_SUB(CURDATE(), INTERVAL (t.id % 8 + 1) YEAR),
    'L1',
    CONCAT('88', LPAD((t.id * 7 + 6000000) % 100000000, 8, '0')),
    CONCAT('Staff Colony, ', COALESCE(t.village_town, 'Mysuru'), ', Karnataka'),
    0,
    'ACTIVE',
    0, @ts, @ts, @sys, @sys
FROM temples t
WHERE t.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM employees e
        WHERE e.temple_id = t.id AND e.employee_type = 'SECURITY'
          AND e.designation = 'Security Guard' AND e.is_deleted = 0
    );

-- =============================================================================
-- SECTION 7: NIGHT SECURITY GUARD (Grade A temples + 50% of Grade B)
-- =============================================================================
INSERT INTO employees (
    temple_id, employee_ref, full_name, employee_type, designation,
    date_of_joining, salary_grade, mobile, address, is_hereditary,
    status, is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    t.id,
    CONCAT('EMP-', LPAD(t.id, 6, '0'), '-SE2'),
    ELT(1 + (t.id % 12),
        'Dodda Sidda',   'Maraiah',       'Karibasappa',   'Maaraiah',
        'Ningappa',      'Gowraiah',      'Bommaiah',      'Puttaiah',
        'Muthaiah',      'Rangaiah',      'Somashekar',    'Ningaraju') AS full_name,
    'SECURITY',
    'Night Security Guard',
    DATE_SUB(CURDATE(), INTERVAL (t.id % 5 + 1) YEAR),
    'L1',
    CONCAT('86', LPAD((t.id * 23 + 8000000) % 100000000, 8, '0')),
    CONCAT('Staff Colony, ', COALESCE(t.village_town, 'Mysuru'), ', Karnataka'),
    0,
    'ACTIVE',
    0, @ts, @ts, @sys, @sys
FROM temples t
WHERE (t.grade = 'A' OR (t.grade = 'B' AND t.id % 2 = 0))
  AND t.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM employees e
        WHERE e.temple_id = t.id AND e.employee_type = 'SECURITY'
          AND e.designation = 'Night Security Guard' AND e.is_deleted = 0
    );

-- =============================================================================
-- SECTION 8: MAINTENANCE / GARDENER (all temples)
-- =============================================================================
INSERT INTO employees (
    temple_id, employee_ref, full_name, employee_type, designation,
    date_of_joining, salary_grade, mobile, address, is_hereditary,
    status, is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    t.id,
    CONCAT('EMP-', LPAD(t.id, 6, '0'), '-MT1'),
    ELT(1 + (t.id % 12),
        'Ramaiah',       'Shobakar',      'Prasad',        'Muniswamy',
        'Chikkappa',     'Venkatesh',     'Nagaraju',      'Hanumaiah',
        'Marappa',       'Doddaiah',      'Nagaiah',       'Siddaiah') AS full_name,
    'MAINTENANCE',
    ELT(1 + (t.id % 3), 'Gardener', 'Cleaner', 'Property Caretaker'),
    DATE_SUB(CURDATE(), INTERVAL (t.id % 6 + 1) YEAR),
    'L1',
    CONCAT('87', LPAD((t.id * 19 + 7000000) % 100000000, 8, '0')),
    CONCAT('Village Road, ', COALESCE(t.village_town, 'Mysuru'), ', Karnataka'),
    0,
    'ACTIVE',
    0, @ts, @ts, @sys, @sys
FROM temples t
WHERE t.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM employees e
        WHERE e.temple_id = t.id AND e.employee_type = 'MAINTENANCE' AND e.is_deleted = 0
    );

-- =============================================================================
-- SECTION 9: SECOND MAINTENANCE WORKER (Grade A and B temples)
-- =============================================================================
INSERT INTO employees (
    temple_id, employee_ref, full_name, employee_type, designation,
    date_of_joining, salary_grade, mobile, address, is_hereditary,
    status, is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    t.id,
    CONCAT('EMP-', LPAD(t.id, 6, '0'), '-MT2'),
    ELT(1 + (t.id % 10),
        'Yellaiah',      'Boraiah',       'Doreswamy',     'Kenchaiah',
        'Lingaiah',      'Mastre',        'Nanjaiah',      'Obaiah',
        'Papaiah',       'Rajaiah') AS full_name,
    'MAINTENANCE',
    'Cleaner',
    DATE_SUB(CURDATE(), INTERVAL (t.id % 4 + 1) YEAR),
    'L1',
    CONCAT('81', LPAD((t.id * 29 + 9000000) % 100000000, 8, '0')),
    CONCAT('Temple Layout, ', COALESCE(t.village_town, 'Mysuru'), ', Karnataka'),
    0,
    'ACTIVE',
    0, @ts, @ts, @sys, @sys
FROM temples t
WHERE t.grade IN ('A', 'B') AND t.is_deleted = 0
  AND (SELECT COUNT(*) FROM employees e
       WHERE e.temple_id = t.id AND e.employee_type = 'MAINTENANCE' AND e.is_deleted = 0) < 2;

-- =============================================================================
-- SECTION 10: EDGE CASE — A few RESIGNED and RETIRED employees (for workflow testing)
-- These simulate staff turnover and enable testing of date_of_leaving validation.
-- =============================================================================
INSERT INTO employees (
    temple_id, employee_ref, full_name, employee_type, designation,
    date_of_joining, date_of_leaving, salary_grade, mobile, address, is_hereditary,
    status, is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    t.id,
    CONCAT('EMP-', LPAD(t.id, 6, '0'), '-RT1'),
    ELT(1 + (t.id % 8),
        'Retired Priest Narayana',   'Former Admin Suresh',
        'Ex-Guard Thimmappa',        'Old Priest Krishnaiah',
        'Resigned Admin Ramesh',     'Ex-Security Lokesh',
        'Retired Priest Govinda',    'Former Treasurer Venkat') AS full_name,
    ELT(1 + (t.id % 4), 'PRIEST', 'ADMINISTRATIVE', 'SECURITY', 'MAINTENANCE') AS employee_type,
    ELT(1 + (t.id % 3), 'Former Head Priest', 'Former Admin Officer', 'Former Guard') AS designation,
    DATE_SUB(CURDATE(), INTERVAL (t.id % 30 + 10) YEAR),
    DATE_SUB(CURDATE(), INTERVAL (t.id % 365 + 30) DAY),
    ELT(1 + (t.id % 4), 'L5', 'L4', 'L3', 'L1') AS salary_grade,
    CONCAT('92', LPAD((t.id * 31 + 9500000) % 100000000, 8, '0')),
    CONCAT('Former Quarters, ', COALESCE(t.village_town, 'Mysuru'), ', Karnataka'),
    0,
    CASE t.id % 2 WHEN 0 THEN 'RETIRED' ELSE 'RESIGNED' END,
    0, @ts, @ts, @sys, @sys
FROM temples t
WHERE t.id % 15 = 0   -- every 15th temple has a former employee record
  AND t.is_deleted = 0;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- Verification:
-- SELECT employee_type, COUNT(*) FROM employees WHERE is_deleted=0 GROUP BY employee_type;
-- SELECT COUNT(DISTINCT temple_id) FROM employees WHERE is_deleted=0;
--   (should equal total active temple count)
-- =============================================================================
