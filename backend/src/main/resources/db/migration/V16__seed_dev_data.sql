-- ============================================================
-- V16: Development Seed Data
--
-- Plain-text password for ALL accounts: password123
-- BCrypt hash: $2a$12$Jh5AwLDdLLbuS.Otkb0AK.2aFveu2vjEBCOYKEDKEYk757A2yNrQS
--
-- Login accounts:
--   dc@test.com       / password123  → DISTRICT_COLLECTOR (district 1 = Mysuru)
--   staff@test.com    / password123  → DC_STAFF           (district 1 = Mysuru)
--   ta@test.com       / password123  → TEMPLE_AUTHORITY   (linked to Temple 1)
--   ta2@test.com      / password123  → TEMPLE_AUTHORITY   (linked to Temple 2)
--   admin@test.com    / password123  → SUPER_ADMIN
--
-- Workflow test guide:
--   Temple 1 (Chamundeshwari)  → declaration id=1  status=PENDING_REVIEW  (approve/reject/clarify here)
--   Temple 2 (Brindavana)      → declaration id=3  status=APPROVED
--   Temple 3 (Venkateshwara)   → declaration id=5  status=CLARIFICATION_REQUESTED  (respond to clarification)
--   Temple 4 (Keshava)         → declaration id=7  status=REJECTED
--   Temple 5 (Mahakali)        → declaration id=9  status=PHYSICAL_VERIFICATION_REQUESTED
-- ============================================================

-- ─── DISABLE FK CHECKS DURING SEED ───────────────────────────────────────────
SET FOREIGN_KEY_CHECKS = 0;

-- ─── 1. GEO HIERARCHY ────────────────────────────────────────────────────────

INSERT INTO states (id, name, code, is_deleted, created_by, updated_by)
VALUES (1, 'Karnataka', 'KA', 0, NULL, NULL);

INSERT INTO cities (id, state_id, name, is_deleted, created_by, updated_by)
VALUES (1, 1, 'Mysuru', 0, NULL, NULL);

INSERT INTO districts (id, city_id, name, is_deleted, created_by, updated_by)
VALUES (1, 1, 'Mysuru', 0, NULL, NULL);

INSERT INTO taluks (id, district_id, name, is_deleted, created_by, updated_by)
VALUES
    (1, 1, 'Mysuru Taluk', 0, NULL, NULL),
    (2, 1, 'Nanjangud Taluk', 0, NULL, NULL);

INSERT INTO hoblis (id, taluk_id, name, is_deleted, created_by, updated_by)
VALUES
    (1, 1, 'Kasaba Hobli', 0, NULL, NULL),
    (2, 1, 'Jayapura Hobli', 0, NULL, NULL),
    (3, 2, 'Nanjangud Hobli', 0, NULL, NULL);

-- ─── 2. USERS ────────────────────────────────────────────────────────────────
-- BCrypt hash of "password123" with cost 12:
-- $2a$12$Jh5AwLDdLLbuS.Otkb0AK.2aFveu2vjEBCOYKEDKEYk757A2yNrQS

-- id=1: District Collector (acts on Mysuru district)
INSERT INTO users (id, username, email, password_hash, full_name, mobile, role,
                   district_id, temple_id, mfa_type, is_active, aadhaar_verified,
                   failed_login_count, is_deleted, created_by, updated_by)
VALUES (1, 'dc_mysuru', 'dc@test.com',
        '$2a$12$Jh5AwLDdLLbuS.Otkb0AK.2aFveu2vjEBCOYKEDKEYk757A2yNrQS',
        'Rajesh Kumar Verma', '9880001111', 'DISTRICT_COLLECTOR',
        1, NULL, 'NONE', 1, 1, 0, 0, NULL, NULL);

-- id=2: DC Staff (same district, read-only workflow perspective)
INSERT INTO users (id, username, email, password_hash, full_name, mobile, role,
                   district_id, temple_id, mfa_type, is_active, aadhaar_verified,
                   failed_login_count, is_deleted, created_by, updated_by)
VALUES (2, 'staff_mysuru', 'staff@test.com',
        '$2a$12$Jh5AwLDdLLbuS.Otkb0AK.2aFveu2vjEBCOYKEDKEYk757A2yNrQS',
        'Meena Subramaniam', '9880002222', 'DC_STAFF',
        1, NULL, 'NONE', 1, 1, 0, 0, NULL, NULL);

-- id=3: Super Admin
INSERT INTO users (id, username, email, password_hash, full_name, mobile, role,
                   district_id, temple_id, mfa_type, is_active, aadhaar_verified,
                   failed_login_count, is_deleted, created_by, updated_by)
VALUES (3, 'super_admin', 'admin@test.com',
        '$2a$12$Jh5AwLDdLLbuS.Otkb0AK.2aFveu2vjEBCOYKEDKEYk757A2yNrQS',
        'Admin User', '9880003333', 'SUPER_ADMIN',
        NULL, NULL, 'NONE', 1, 1, 0, 0, NULL, NULL);

-- id=4: Temple Authority for Temple 1 (Chamundeshwari)
INSERT INTO users (id, username, email, password_hash, full_name, mobile, role,
                   district_id, temple_id, mfa_type, is_active, aadhaar_verified,
                   failed_login_count, is_deleted, created_by, updated_by)
VALUES (4, 'ta_chamundi', 'ta@test.com',
        '$2a$12$Jh5AwLDdLLbuS.Otkb0AK.2aFveu2vjEBCOYKEDKEYk757A2yNrQS',
        'Girish Rao', '9880004444', 'TEMPLE_AUTHORITY',
        1, 1, 'NONE', 1, 1, 0, 0, NULL, NULL);

-- id=5: Temple Authority for Temple 2 (Brindavana)
INSERT INTO users (id, username, email, password_hash, full_name, mobile, role,
                   district_id, temple_id, mfa_type, is_active, aadhaar_verified,
                   failed_login_count, is_deleted, created_by, updated_by)
VALUES (5, 'ta_brindavana', 'ta2@test.com',
        '$2a$12$Jh5AwLDdLLbuS.Otkb0AK.2aFveu2vjEBCOYKEDKEYk757A2yNrQS',
        'Padma Krishnamurthy', '9880005555', 'TEMPLE_AUTHORITY',
        1, 2, 'NONE', 1, 1, 0, 0, NULL, NULL);

-- ─── 3. TEMPLES ──────────────────────────────────────────────────────────────

INSERT INTO temples (id, name, grade, tradition, district_id, taluk_id, hobli_id,
                     address_line1, city, pin_code, contact_name, contact_email,
                     contact_phone, trust_registered, asset_declaration_status,
                     primary_deity, registration_number,
                     version, is_deleted, created_by, updated_by)
VALUES
    -- Temple 1: Grade A, trust-registered, PENDING_REVIEW declaration
    (1, 'Sri Chamundeshwari Temple', 'A', 'SHAKTA', 1, 1, 1,
     'Chamundi Hills Road', 'Mysuru', '570010',
     'Girish Rao', 'chamundi@temple.in', '9880004444',
     1, 'PENDING_REVIEW',
     'Chamundeshwari Devi', 'KA-TEMP-2005-001',
     0, 0, 3, 3),

    -- Temple 2: Grade A, trust-registered, APPROVED declaration
    (2, 'Sri Brindavana Swami Temple', 'A', 'VAISHNAVITE', 1, 1, 2,
     'T. Narasipur Road, Sivanahalli', 'Mysuru', '571124',
     'Padma Krishnamurthy', 'brindavana@temple.in', '9880005555',
     1, 'APPROVED',
     'Sri Brindavana Swami', 'KA-TEMP-1998-047',
     0, 0, 3, 3),

    -- Temple 3: Grade B, CLARIFICATION_REQUESTED declaration
    (3, 'Sri Venkateshwara Temple', 'B', 'VAISHNAVITE', 1, 1, 2,
     'Vidyaranyapuram Main Road', 'Mysuru', '570008',
     'Anand Murthy', 'venkatesh@temple.in', '9880006666',
     0, 'CLARIFICATION_REQUESTED',
     'Sri Venkateshwara', 'KA-TEMP-2010-123',
     0, 0, 3, 3),

    -- Temple 4: Grade B, REJECTED declaration
    (4, 'Sri Keshava Temple', 'B', 'VAISHNAVITE', 1, 2, 3,
     'Belur Road, Nanjangud', 'Nanjangud', '571302',
     'Srinivasa Bhat', 'keshava@temple.in', '9880007777',
     0, 'REJECTED',
     'Sri Keshava', 'KA-TEMP-2002-256',
     0, 0, 3, 3),

    -- Temple 5: Grade C, PHYSICAL_VERIFICATION_REQUESTED declaration
    (5, 'Sri Mahakali Devi Temple', 'C', 'SHAKTA', 1, 2, 3,
     'Old Town, Nanjangud', 'Nanjangud', '571301',
     'Kavitha Devi', 'mahakali@temple.in', '9880008888',
     0, NULL,
     'Mahakali Devi', 'KA-TEMP-2015-089',
     0, 0, 3, 3);

-- Update temple_id on TA user 1 (done before FK check re-enable)
UPDATE users SET temple_id = 1 WHERE id = 4;
UPDATE users SET temple_id = 2 WHERE id = 5;

-- ─── 4. TRUST DATA ───────────────────────────────────────────────────────────

INSERT INTO trust_registrations (id, temple_id, trust_type, trust_name,
                                  registration_number, registered_date, date_of_registration,
                                  bank_name, bank_ifsc, version, is_deleted,
                                  created_by, updated_by)
VALUES
    (1, 1, 'PUBLIC', 'Chamundeshwari Devasthana Trust',
     'KA-TR-2010-001', '2010-04-15', '2010-04-15',
     'State Bank of India', 'SBIN0040256', 0, 0, 3, 3),

    (2, 2, 'PUBLIC', 'Brindavana Swami Seva Trust',
     'KA-TR-2008-047', '2008-09-01', '2008-09-01',
     'Canara Bank', 'CNRB0001234', 0, 0, 3, 3);

-- Board members — Temple 1 trust
INSERT INTO board_members (id, trust_id, full_name, designation,
                            appointment_date, tenure_end_date, contact_number,
                            is_current, is_deleted, created_by, updated_by)
VALUES
    (1, 1, 'Girish Rao',         'President',    '2022-06-01', '2026-05-31', '9880004444', 1, 0, 3, 3),
    (2, 1, 'Nalini Suresh',      'Treasurer',    '2022-06-01', '2026-05-31', '9880011111', 1, 0, 3, 3),
    (3, 1, 'Pramod Gowda',       'Secretary',    '2022-06-01', '2026-05-31', '9880012222', 1, 0, 3, 3),
    -- Past member (tenure ended)
    (4, 1, 'H.S. Ramachandran',  'Past President','2018-06-01', '2022-05-31', '9880013333', 0, 0, 3, 3);

-- Board members — Temple 2 trust
INSERT INTO board_members (id, trust_id, full_name, designation,
                            appointment_date, tenure_end_date, contact_number,
                            is_current, is_deleted, created_by, updated_by)
VALUES
    (5, 2, 'Padma Krishnamurthy', 'Chairperson', '2021-01-01', '2025-12-31', '9880005555', 1, 0, 3, 3),
    (6, 2, 'K. Manjunath',        'Treasurer',   '2021-01-01', '2025-12-31', '9880014444', 1, 0, 3, 3);

-- Trust financials — Temple 1
INSERT INTO trust_financials (id, trust_id, financial_year, total_income,
                               total_expenditure, surplus_deficit,
                               auditor_name, audit_date, is_deleted,
                               created_by, updated_by)
VALUES
    (1, 1, '2023-24', 4850000.00, 3920000.00,  930000.00, 'M/s. Venkat & Associates', '2024-07-31', 0, 3, 3),
    (2, 1, '2024-25', 5600000.00, 4350000.00, 1250000.00, 'M/s. Venkat & Associates', '2025-07-30', 0, 3, 3);

-- Trust financials — Temple 2
INSERT INTO trust_financials (id, trust_id, financial_year, total_income,
                               total_expenditure, surplus_deficit,
                               auditor_name, audit_date, is_deleted,
                               created_by, updated_by)
VALUES
    (3, 2, '2023-24', 2200000.00, 1980000.00, 220000.00, 'R.K. Shetty & Co.', '2024-08-15', 0, 3, 3),
    (4, 2, '2024-25', 2750000.00, 2100000.00, 650000.00, 'R.K. Shetty & Co.', '2025-08-10', 0, 3, 3);

-- ─── 5. EMPLOYEES ────────────────────────────────────────────────────────────

INSERT INTO employees (id, temple_id, full_name, employee_type, status,
                       designation, mobile, email, joining_date, is_deleted,
                       created_by, updated_by)
VALUES
    -- Temple 1 employees
    (1, 1, 'Shiva Prakash',    'PRIEST',          'ACTIVE', 'Head Priest',        '9880020001', NULL,                     '2015-04-01', 0, 3, 3),
    (2, 1, 'Ramesh Kumar',     'PRIEST',          'ACTIVE', 'Associate Priest',   '9880020002', NULL,                     '2019-08-15', 0, 3, 3),
    (3, 1, 'Veena Devi',       'ADMINISTRATIVE',  'ACTIVE', 'Office Manager',     '9880020003', 'veena@chamundi.in',       '2017-01-10', 0, 3, 3),
    (4, 1, 'Lokesh B.',        'MAINTENANCE',     'ACTIVE', 'Site Manager',       '9880020004', NULL,                     '2020-06-01', 0, 3, 3),
    (5, 1, 'Suresh B.',        'SECURITY',        'ACTIVE', 'Security Guard',     '9880020005', NULL,                     '2021-03-15', 0, 3, 3),
    -- Temple 2 employees
    (6, 2, 'Nagendra Rao',     'PRIEST',          'ACTIVE', 'Chief Priest',       '9880020006', NULL,                     '2012-04-01', 0, 3, 3),
    (7, 2, 'Sunitha Murthy',   'ADMINISTRATIVE',  'ACTIVE', 'Accountant',         '9880020007', 'sunitha@brindavana.in',  '2018-09-01', 0, 3, 3),
    (8, 2, 'Mahesh T.',        'MAINTENANCE',     'ACTIVE', 'Maintenance Worker', '9880020008', NULL,                     '2022-02-14', 0, 3, 3),
    -- Temple 3 employees
    (9, 3, 'Kiran Murthy',     'PRIEST',          'ACTIVE', 'Priest',             '9880020009', NULL,                     '2016-07-01', 0, 3, 3),
    (10, 3, 'Anitha Kumari',   'ADMINISTRATIVE',  'ACTIVE', 'Office Assistant',   '9880020010', NULL,                     '2023-01-01', 0, 3, 3),
    -- Temple 4 employees
    (11, 4, 'Ravi Shankar',    'PRIEST',          'ACTIVE', 'Head Priest',        '9880020011', NULL,                     '2010-05-01', 0, 3, 3),
    (12, 4, 'Basavanna',       'MAINTENANCE',     'ACTIVE', 'Groundsman',         '9880020012', NULL,                     '2019-11-01', 0, 3, 3),
    -- Temple 5 employees
    (13, 5, 'Chandrakala',     'PRIEST',          'ACTIVE', 'Priestess',          '9880020013', NULL,                     '2014-08-01', 0, 3, 3),
    (14, 5, 'Nagaraja B.',     'SECURITY',        'ACTIVE', 'Security Guard',     '9880020014', NULL,                     '2023-06-15', 0, 3, 3);

-- ─── 6. CONTRACTORS ──────────────────────────────────────────────────────────

INSERT INTO contractors (id, temple_id, company_name, name, gst_number, service_type,
                          contract_reference, work_order_date, contract_start_date,
                          contract_end_date, contract_value, payment_status,
                          is_deleted, created_by, updated_by)
VALUES
    (1, 1, 'Sri Balaji Constructions Pvt. Ltd.', 'Sri Balaji Constructions Pvt. Ltd.', '29AABCS1234A1Z5',
     'Gopura Renovation', 'WO-2024-001',
     '2024-04-01', '2024-05-01', '2025-04-30', 3500000.00, 'PARTIALLY_PAID',
     0, 3, 3),

    (2, 1, 'Divine Electrical Works', 'Divine Electrical Works', '29AADDE4567B1Z8',
     'Electrical Wiring Upgrade', 'WO-2024-002',
     '2024-06-01', '2024-07-01', '2024-12-31', 750000.00, 'FULLY_PAID',
     0, 3, 3),

    (3, 2, 'Kaveri Landscaping & Gardens', 'Kaveri Landscaping & Gardens', '29AACKL7890C1Z2',
     'Garden Maintenance', 'WO-2024-003',
     '2024-01-15', '2024-02-01', '2025-01-31', 420000.00, 'CURRENT',
     0, 3, 3);

-- ─── 7. ASSET DECLARATIONS ───────────────────────────────────────────────────

-- Declaration 1: Temple 1 — PENDING_REVIEW (this is the primary approve/reject test case)
INSERT INTO asset_declarations (id, temple_id, district_id, status,
    acknowledgement_number, financial_year, version_number,
    agricultural_land_acres, agricultural_land_value,
    buildings_sqft, buildings_value,
    gold_grams, silver_grams, idols_count, vehicles_count,
    financial_assets_value,
    annual_income, annual_expenditure,
    due_date, submitted_at, submitted_by,
    clarification_round,
    snapshot_json, lock_version, is_deleted, created_by, updated_by)
VALUES (1, 1, 1, 'PENDING_REVIEW',
    NULL, '2024-25', 1,
    12.500, 8750000.00,
    6500.00, 22000000.00,
    3250.000, 15000.000, 48, 2,
    12500000.00,
    5600000.00, 4350000.00,
    '2025-07-31', '2025-04-05 10:30:00', 4,
    0,
    JSON_OBJECT(
        'financialYear', '2024-25',
        'agriculturalLandAcres', 12.5,
        'agriculturalLandValue', 8750000.0,
        'buildingsSqft', 6500.0,
        'buildingsValue', 22000000.0,
        'goldGrams', 3250.0,
        'silverGrams', 15000.0,
        'idolsCount', 48,
        'vehiclesCount', 2,
        'financialAssetsValue', 12500000.0,
        'annualIncome', 5600000.0,
        'annualExpenditure', 4350000.0
    ),
    0, 0, 4, 4);

-- Clarification message for declaration 1 (from DC side, round 0 → used for context)
-- None yet — it's fresh PENDING_REVIEW

-- Declaration 2 (older version of Temple 1, SUPERSEDED — tests version history)
-- Skipping to keep it simple; only one declaration per temple per year

-- Declaration 3: Temple 2 — APPROVED
INSERT INTO asset_declarations (id, temple_id, district_id, status,
    acknowledgement_number, financial_year, version_number,
    agricultural_land_acres, agricultural_land_value,
    buildings_sqft, buildings_value,
    gold_grams, silver_grams, idols_count, vehicles_count,
    financial_assets_value,
    annual_income, annual_expenditure,
    due_date, submitted_at, submitted_by, reviewed_at, reviewed_by,
    clarification_round,
    snapshot_json, lock_version, is_deleted, created_by, updated_by)
VALUES (3, 2, 1, 'APPROVED',
    'ACK-2024-25-001',  '2024-25', 1,
    5.250, 3675000.00,
    3800.00, 12000000.00,
    1800.000, 9000.000, 30, 1,
    8000000.00,
    2750000.00, 2100000.00,
    '2025-07-31', '2025-03-20 09:00:00', 5, '2025-03-28 14:30:00', 1,
    0,
    JSON_OBJECT(
        'financialYear', '2024-25',
        'agriculturalLandAcres', 5.25,
        'agriculturalLandValue', 3675000.0,
        'buildingsSqft', 3800.0,
        'buildingsValue', 12000000.0,
        'goldGrams', 1800.0,
        'silverGrams', 9000.0,
        'idolsCount', 30,
        'vehiclesCount', 1,
        'financialAssetsValue', 8000000.0,
        'annualIncome', 2750000.0,
        'annualExpenditure', 2100000.0
    ),
    0, 0, 5, 1);

-- Declaration 5: Temple 3 — CLARIFICATION_REQUESTED (round 1)
INSERT INTO asset_declarations (id, temple_id, district_id, status,
    acknowledgement_number, financial_year, version_number,
    buildings_sqft, buildings_value,
    gold_grams, silver_grams, idols_count,
    financial_assets_value,
    annual_income, annual_expenditure,
    due_date, submitted_at, submitted_by,
    clarification_round,
    snapshot_json, lock_version, is_deleted, created_by, updated_by)
VALUES (5, 3, 1, 'CLARIFICATION_REQUESTED',
    NULL, '2024-25', 1,
    2200.00, 7000000.00,
    500.000, 3000.000, 12,
    2500000.00,
    1200000.00, 980000.00,
    '2025-07-31', '2025-03-15 11:00:00', 3,
    1,
    JSON_OBJECT(
        'financialYear', '2024-25',
        'buildingsSqft', 2200.0,
        'buildingsValue', 7000000.0,
        'goldGrams', 500.0,
        'silverGrams', 3000.0,
        'idolsCount', 12,
        'financialAssetsValue', 2500000.0,
        'annualIncome', 1200000.0,
        'annualExpenditure', 980000.0
    ),
    1, 0, 3, 1);

-- Clarification messages for declaration 5
INSERT INTO declaration_clarifications (id, declaration_id, direction, message,
                                         section_name, author_id, created_at)
VALUES
    (1, 5, 'DC_TO_TEMPLE',
     'Please provide the survey numbers for the temple building property and attach a copy of the property tax receipt for FY 2024-25.',
     'DECLARATION', 1, '2025-03-22 10:00:00');

-- Declaration 7: Temple 4 — REJECTED (immutable)
INSERT INTO asset_declarations (id, temple_id, district_id, status,
    acknowledgement_number, financial_year, version_number,
    buildings_sqft, buildings_value,
    gold_grams, silver_grams, idols_count,
    annual_income, annual_expenditure,
    due_date, submitted_at, submitted_by, reviewed_at, reviewed_by,
    clarification_round,
    snapshot_json, lock_version, is_deleted, created_by, updated_by)
VALUES (7, 4, 1, 'REJECTED',
    NULL, '2024-25', 1,
    1500.00, 4500000.00,
    200.000, 1500.000, 8,
    850000.00, 760000.00,
    '2025-07-31', '2025-02-10 08:00:00', 3, '2025-02-20 16:00:00', 1,
    0,
    JSON_OBJECT(
        'financialYear', '2024-25',
        'buildingsSqft', 1500.0,
        'buildingsValue', 4500000.0,
        'goldGrams', 200.0,
        'silverGrams', 1500.0,
        'idolsCount', 8,
        'annualIncome', 850000.0,
        'annualExpenditure', 760000.0
    ),
    0, 0, 3, 1);

-- Declaration 9: Temple 5 — PHYSICAL_VERIFICATION_REQUESTED
INSERT INTO asset_declarations (id, temple_id, district_id, status,
    acknowledgement_number, financial_year, version_number,
    agricultural_land_acres, agricultural_land_value,
    buildings_sqft, buildings_value,
    gold_grams, idols_count,
    annual_income, annual_expenditure,
    due_date, submitted_at, submitted_by,
    clarification_round,
    snapshot_json, lock_version, is_deleted, created_by, updated_by)
VALUES (9, 5, 1, 'PHYSICAL_VERIFICATION_REQUESTED',
    NULL, '2024-25', 1,
    3.000, 1200000.00,
    900.00, 3000000.00,
    120.000, 6,
    380000.00, 310000.00,
    '2025-07-31', '2025-03-01 13:00:00', 3,
    0,
    JSON_OBJECT(
        'financialYear', '2024-25',
        'agriculturalLandAcres', 3.0,
        'agriculturalLandValue', 1200000.0,
        'buildingsSqft', 900.0,
        'buildingsValue', 3000000.0,
        'goldGrams', 120.0,
        'idolsCount', 6,
        'annualIncome', 380000.0,
        'annualExpenditure', 310000.0
    ),
    0, 0, 3, 1);

-- Physical verification clarification entry for declaration 9
INSERT INTO declaration_clarifications (id, declaration_id, direction, message,
                                         section_name, author_id, created_at)
VALUES
    (2, 9, 'DC_TO_TEMPLE',
     'Physical verification of agricultural land parcels is required. Please make the property available for inspection by the district surveyor.',
     'PHYSICAL_VERIFICATION', 1, '2025-03-10 09:00:00');

-- Acknowledgement sequence seed (1 row for FY 2024-25 = the approved declaration)
INSERT INTO acknowledgement_sequences (financial_year)
VALUES ('2024-25');

-- ─── 8. TEMPLE SEARCH SUMMARY ─────────────────────────────────────────────────
-- Denormalised cache for DC dashboard queries.

INSERT INTO temple_search_summary (
    id, temple_id, name, grade, tradition,
    district_id, district_name, city_id,
    trust_registered, declaration_status,
    temple_status,
    pending_declarations, overdue_declarations,
    pending_profile_review, has_active_trust,
    has_approved_declaration,
    last_declaration_at, updated_at)
VALUES
    -- Temple 1: PENDING_REVIEW, trust-registered
    (1, 1, 'Sri Chamundeshwari Temple', 'A', 'SHAKTA',
     1, 'Mysuru', 1,
     1, 'PENDING_REVIEW',
     'ACTIVE',
     1, 0, 0, 1, 0,
     '2025-04-05 10:30:00', NOW()),

    -- Temple 2: APPROVED, trust-registered
    (2, 2, 'Sri Brindavana Swami Temple', 'A', 'VAISHNAVITE',
     1, 'Mysuru', 1,
     1, 'APPROVED',
     'ACTIVE',
     0, 0, 0, 1, 1,
     '2025-03-20 09:00:00', NOW()),

    -- Temple 3: CLARIFICATION_REQUESTED
    (3, 3, 'Sri Venkateshwara Temple', 'B', 'VAISHNAVITE',
     1, 'Mysuru', 1,
     0, 'CLARIFICATION_REQUESTED',
     'ACTIVE',
     1, 0, 0, 0, 0,
     '2025-03-15 11:00:00', NOW()),

    -- Temple 4: REJECTED
    (4, 4, 'Sri Keshava Temple', 'B', 'VAISHNAVITE',
     1, 'Mysuru', 1,
     0, 'REJECTED',
     'ACTIVE',
     0, 0, 0, 0, 0,
     '2025-02-10 08:00:00', NOW()),

    -- Temple 5: PHYSICAL_VERIFICATION_REQUESTED, overdue
    (5, 5, 'Sri Mahakali Devi Temple', 'C', 'SHAKTA',
     1, 'Mysuru', 1,
     0, 'PHYSICAL_VERIFICATION_REQUESTED',
     'ACTIVE',
     1, 1, 0, 0, 0,
     '2025-03-01 13:00:00', NOW());

-- ─── 9. TEMPLE PROFILE STAGING ────────────────────────────────────────────────
-- One approved profile for Temple 2

INSERT INTO temple_profile_staging (id, temple_id, version, status,
    contact_person_name, contact_person_designation,
    languages_of_worship, annual_festivals, landmark,
    historical_significance,
    submitted_at, submitted_by, reviewed_at, reviewed_by, review_comment,
    is_deleted)
VALUES (1, 2, 1, 'APPROVED',
    'Padma Krishnamurthy', 'Chairperson',
    'Kannada, Sanskrit',
    'Brahmotsava (10 days, March/April), Vaikunta Ekadashi, Janmashtami',
    'Located on the banks of river Kabini, 45 km from Mysuru',
    'Centuries-old Vaishnavite shrine revered by the Wodeyar dynasty; historically patronised by Tipu Sultan era nobles.',
    '2025-01-15 10:00:00', 5, '2025-01-25 14:00:00', 1, 'Profile content verified. Approved.',
    0);

-- Corresponding current profile for Temple 2
INSERT INTO temple_profile_current (id, temple_id,
    contact_person_name, contact_person_designation,
    languages_of_worship, annual_festivals, landmark,
    historical_significance,
    published_at, published_by)
VALUES (1, 2,
    'Padma Krishnamurthy', 'Chairperson',
    'Kannada, Sanskrit',
    'Brahmotsava (10 days, March/April), Vaikunta Ekadashi, Janmashtami',
    'Located on the banks of river Kabini, 45 km from Mysuru',
    'Centuries-old Vaishnavite shrine revered by the Wodeyar dynasty; historically patronised by Tipu Sultan era nobles.',
    '2025-01-25 14:00:00', 1);

-- ─── 10. IN-APP NOTIFICATIONS (DC USER) ──────────────────────────────────────
-- 8 notifications; 3 read, 5 unread

INSERT INTO in_app_notifications (id, user_id, title, body,
                                   reference_id, reference_type,
                                   is_read, read_at, created_at)
VALUES
    -- Read notifications
    (1, 1,
     'Declaration Approved — Sri Brindavana Swami Temple',
     'You successfully approved the FY 2024-25 asset declaration for Sri Brindavana Swami Temple. Acknowledgement: ACK-2024-25-001.',
     3, 'ASSET_DECLARATION', 1, '2025-03-28 15:00:00', '2025-03-28 14:30:00'),

    (2, 1,
     'Declaration Rejected — Sri Keshava Temple',
     'The FY 2024-25 asset declaration for Sri Keshava Temple was rejected due to incomplete immovable asset details.',
     7, 'ASSET_DECLARATION', 1, '2025-02-21 08:00:00', '2025-02-20 16:00:00'),

    (3, 1,
     'Profile Approved — Sri Brindavana Swami Temple',
     'The temple profile update submitted by Sri Brindavana Swami Temple has been approved and is now live.',
     1, 'TEMPLE_PROFILE', 1, '2025-01-26 09:00:00', '2025-01-25 14:00:00'),

    -- Unread notifications
    (4, 1,
     'New Declaration Submitted — Sri Chamundeshwari Temple',
     'Sri Chamundeshwari Temple has submitted a new asset declaration for FY 2024-25. Action required.',
     1, 'ASSET_DECLARATION', 0, NULL, '2025-04-05 10:30:00'),

    (5, 1,
     'Clarification Response Received — Sri Venkateshwara Temple',
     'Sri Venkateshwara Temple has responded to your clarification request for the FY 2024-25 declaration.',
     5, 'ASSET_DECLARATION', 0, NULL, '2025-04-02 16:00:00'),

    (6, 1,
     'Physical Verification Flagged — Sri Mahakali Devi Temple',
     'The FY 2024-25 declaration for Sri Mahakali Devi Temple has been flagged for physical verification. Schedule inspection accordingly.',
     9, 'ASSET_DECLARATION', 0, NULL, '2025-03-10 09:00:00'),

    (7, 1,
     'Declaration Overdue Alert',
     'Sri Mahakali Devi Temple has an overdue declaration for FY 2024-25. Deadline was 31-Jul-2025. Immediate review required.',
     9, 'ASSET_DECLARATION', 0, NULL, '2026-04-01 08:00:00'),

    (8, 1,
     'Dashboard Summary — April 2026',
     'Mysuru District: 5 temples total, 2 declarations pending action, 1 declaration approved this quarter.',
     NULL, NULL, 0, NULL, '2026-04-01 09:00:00');

-- ─── 11. AUDIT DATA ───────────────────────────────────────────────────────────

INSERT INTO audit_data_events (id, actor_id, actor_role, action, entity_type,
                                entity_id, detail, occurred_at)
VALUES
    -- Approval of Temple 2 declaration
    (1, 1, 'DISTRICT_COLLECTOR', 'APPROVE', 'ASSET_DECLARATION',
     3, 'Approved FY 2024-25 declaration for Temple 2 (Sri Brindavana Swami Temple). ACK: ACK-2024-25-001.',
     '2025-03-28 14:30:00'),

    -- Rejection of Temple 4 declaration
    (2, 1, 'DISTRICT_COLLECTOR', 'REJECT', 'ASSET_DECLARATION',
     7, 'Rejected FY 2024-25 declaration for Temple 4 (Sri Keshava Temple). Reason: Incomplete immovable asset details.',
     '2025-02-20 16:00:00'),

    -- Clarification request on Temple 3
    (3, 1, 'DISTRICT_COLLECTOR', 'REQUEST_CLARIFICATION', 'ASSET_DECLARATION',
     5, 'Clarification round 1 initiated for FY 2024-25 declaration of Temple 3 (Sri Venkateshwara Temple).',
     '2025-03-22 10:00:00'),

    -- Physical verification flagged for Temple 5
    (4, 1, 'DISTRICT_COLLECTOR', 'FLAG_PHYSICAL_VERIFICATION', 'ASSET_DECLARATION',
     9, 'Physical verification flagged for FY 2024-25 declaration of Temple 5 (Sri Mahakali Devi Temple).',
     '2025-03-10 09:00:00'),

    -- Profile approval
    (5, 1, 'DISTRICT_COLLECTOR', 'APPROVE', 'TEMPLE_PROFILE',
     1, 'Approved temple profile v1 for Temple 2 (Sri Brindavana Swami Temple).',
     '2025-01-25 14:00:00');

-- Audit auth events
INSERT INTO audit_auth_events (id, user_id, username, event_type, ip_address,
                                outcome, detail, occurred_at)
VALUES
    (1, 1, 'dc_mysuru', 'LOGIN', '192.168.1.10', 'SUCCESS', NULL, '2025-04-09 09:00:00'),
    (2, 2, 'staff_mysuru', 'LOGIN', '192.168.1.11', 'SUCCESS', NULL, '2025-04-09 09:05:00'),
    (3, 4, 'ta_chamundi', 'LOGIN', '192.168.1.20', 'SUCCESS', NULL, '2025-04-05 08:00:00');

-- Audit export events
INSERT INTO audit_export_events (id, actor_id, actor_role, export_type,
                                  filter_summary, record_count, occurred_at)
VALUES
    (1, 1, 'DISTRICT_COLLECTOR', 'TEMPLES',
     '{"districtId":1,"grade":"A"}', 2, '2025-04-01 11:00:00'),

    (2, 1, 'DISTRICT_COLLECTOR', 'DECLARATIONS',
     '{"districtId":1,"status":"APPROVED","financialYear":"2024-25"}', 1, '2025-04-01 11:05:00');

-- ─── RE-ENABLE FK CHECKS ──────────────────────────────────────────────────────
SET FOREIGN_KEY_CHECKS = 1;
