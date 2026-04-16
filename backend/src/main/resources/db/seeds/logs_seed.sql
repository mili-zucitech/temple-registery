-- =============================================================================
-- AUDIT LOGS SEED — Comprehensive Activity Trail
-- Standalone script: run AFTER all other seeds.
-- Idempotent: NOT EXISTS + action guards prevent duplicate log entries.
--
-- Tables populated:
--   audit_data_events   : entity CRUD / workflow events (append-only)
--   audit_auth_events   : login / logout events
--   audit_export_events : CSV export events by DC users
--
-- Event types:
--   TEMPLE:              CREATE · UPDATE · SUSPEND
--   TRUST_REGISTRATION:  CREATE · UPDATE
--   ASSET_DECLARATION:   CREATE · SUBMIT · APPROVE · REJECT · CLARIFY
--   EMPLOYEE:            CREATE · UPDATE · TERMINATE
--   CONTRACTOR:          CREATE
--   DOCUMENT:            UPLOAD
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET @sys = 1;
SET @ts  = NOW();

-- =============================================================================
-- SECTION 1: TEMPLE CREATE EVENTS (one per temple)
-- actor = SUPER_ADMIN who bootstrapped the registry
-- =============================================================================
INSERT INTO audit_data_events (
    actor_id, actor_role, action, entity_type, entity_id, detail, occurred_at
)
SELECT
    @sys,
    'SUPER_ADMIN',
    'CREATE',
    'TEMPLE',
    t.id,
    CONCAT('{"action":"CREATE",'
           '"registrationNumber":"', t.registration_number, '",'
           '"name":"',              REPLACE(t.name, '"', '\\"'), '",'
           '"districtId":',         t.district_id, ','
           '"grade":"',             t.grade, '",'
           '"tradition":"',         COALESCE(t.tradition, 'OTHER'), '"'
           '}'),
    t.created_at
FROM temples t
WHERE t.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM audit_data_events ae
        WHERE ae.entity_type = 'TEMPLE' AND ae.entity_id = t.id AND ae.action = 'CREATE'
    );

-- =============================================================================
-- SECTION 2: TEMPLE UPDATE EVENTS (grade-A temples — richer history)
-- =============================================================================
INSERT INTO audit_data_events (
    actor_id, actor_role, action, entity_type, entity_id, detail, occurred_at
)
SELECT
    CASE t.district_id
        WHEN 1 THEN 2 WHEN 2 THEN 6 WHEN 3 THEN 7 WHEN 4 THEN 8 WHEN 5 THEN 9
        ELSE 1
    END                 AS actor_id,
    'DISTRICT_COLLECTOR',
    'UPDATE',
    'TEMPLE',
    t.id,
    CONCAT('{"action":"UPDATE",'
           '"field":"contact_designation",'
           '"newValue":"', t.contact_designation, '"'
           '}'),
    DATE_SUB(t.updated_at, INTERVAL (t.id % 90 + 5) DAY)
FROM temples t
WHERE t.grade = 'A' AND t.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM audit_data_events ae
        WHERE ae.entity_type = 'TEMPLE' AND ae.entity_id = t.id AND ae.action = 'UPDATE'
    );

-- =============================================================================
-- SECTION 3: TEMPLE SUSPEND EVENTS (suspended temples only)
-- =============================================================================
INSERT INTO audit_data_events (
    actor_id, actor_role, action, entity_type, entity_id, detail, occurred_at
)
SELECT
    2,
    'DISTRICT_COLLECTOR',
    'SUSPEND',
    'TEMPLE',
    t.id,
    CONCAT('{"action":"SUSPEND",'
           '"reason":"Pending compliance investigation under HR&CE Act",'
           '"registrationNumber":"', t.registration_number, '"'
           '}'),
    DATE_SUB(@ts, INTERVAL 30 DAY)
FROM temples t
WHERE t.status = 'SUSPENDED' AND t.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM audit_data_events ae
        WHERE ae.entity_type = 'TEMPLE' AND ae.entity_id = t.id AND ae.action = 'SUSPEND'
    );

-- =============================================================================
-- SECTION 4: TRUST REGISTRATION CREATE EVENTS
-- =============================================================================
INSERT INTO audit_data_events (
    actor_id, actor_role, action, entity_type, entity_id, detail, occurred_at
)
SELECT
    @sys,
    'TEMPLE_AUTHORITY',
    'CREATE',
    'TRUST_REGISTRATION',
    tr.id,
    CONCAT('{"action":"CREATE",'
           '"trustName":"',          REPLACE(tr.trust_name, '"', '\\"'), '",'
           '"registrationNumber":"', tr.registration_number, '",'
           '"trustType":"',          tr.trust_type, '"'
           '}'),
    tr.created_at
FROM trust_registrations tr
WHERE tr.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM audit_data_events ae
        WHERE ae.entity_type = 'TRUST_REGISTRATION' AND ae.entity_id = tr.id
          AND ae.action = 'CREATE'
    );

-- =============================================================================
-- SECTION 5: ASSET DECLARATION CREATE EVENTS
-- =============================================================================
INSERT INTO audit_data_events (
    actor_id, actor_role, action, entity_type, entity_id, detail, occurred_at
)
SELECT
    @sys,
    'TEMPLE_AUTHORITY',
    'CREATE',
    'ASSET_DECLARATION',
    ad.id,
    CONCAT('{"action":"CREATE",'
           '"templeId":',            ad.temple_id, ','
           '"financialYear":"',      ad.financial_year, '",'
           '"status":"',             ad.status, '"'
           '}'),
    ad.created_at
FROM asset_declarations ad
WHERE ad.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM audit_data_events ae
        WHERE ae.entity_type = 'ASSET_DECLARATION' AND ae.entity_id = ad.id
          AND ae.action = 'CREATE'
    );

-- =============================================================================
-- SECTION 6: DECLARATION SUBMIT EVENTS
-- =============================================================================
INSERT INTO audit_data_events (
    actor_id, actor_role, action, entity_type, entity_id, detail, occurred_at
)
SELECT
    @sys,
    'TEMPLE_AUTHORITY',
    'SUBMIT',
    'ASSET_DECLARATION',
    ad.id,
    CONCAT('{"action":"SUBMIT",'
           '"templeId":',             ad.temple_id, ','
           '"financialYear":"',       ad.financial_year, '",'
           '"ack":"',                 COALESCE(ad.acknowledgement_number, ''), '"'
           '}'),
    ad.submitted_at
FROM asset_declarations ad
WHERE ad.submitted_at IS NOT NULL AND ad.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM audit_data_events ae
        WHERE ae.entity_type = 'ASSET_DECLARATION' AND ae.entity_id = ad.id
          AND ae.action = 'SUBMIT'
    );

-- =============================================================================
-- SECTION 7: DECLARATION APPROVE EVENTS
-- =============================================================================
INSERT INTO audit_data_events (
    actor_id, actor_role, action, entity_type, entity_id, detail, occurred_at
)
SELECT
    COALESCE(ad.reviewed_by, 2),
    'DISTRICT_COLLECTOR',
    'APPROVE',
    'ASSET_DECLARATION',
    ad.id,
    CONCAT('{"action":"APPROVE",'
           '"templeId":',            ad.temple_id, ','
           '"ack":"',                COALESCE(ad.acknowledgement_number, ''), '",'
           '"totalIncomeINR":',      COALESCE(ad.annual_income, 0), ','
           '"totalExpINR":',         COALESCE(ad.annual_expenditure, 0), ''
           '}'),
    ad.reviewed_at
FROM asset_declarations ad
WHERE ad.status = 'APPROVED' AND ad.reviewed_at IS NOT NULL AND ad.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM audit_data_events ae
        WHERE ae.entity_type = 'ASSET_DECLARATION' AND ae.entity_id = ad.id
          AND ae.action = 'APPROVE'
    );

-- =============================================================================
-- SECTION 8: DECLARATION CLARIFY REQUEST EVENTS
-- =============================================================================
INSERT INTO audit_data_events (
    actor_id, actor_role, action, entity_type, entity_id, detail, occurred_at
)
SELECT
    CASE t.district_id WHEN 1 THEN 2 WHEN 2 THEN 6 WHEN 3 THEN 7
                       WHEN 4 THEN 8 WHEN 5 THEN 9 ELSE 1 END,
    'DISTRICT_COLLECTOR',
    'REQUEST_CLARIFICATION',
    'ASSET_DECLARATION',
    ad.id,
    CONCAT('{"action":"REQUEST_CLARIFICATION",'
           '"templeId":',         ad.temple_id, ','
           '"round":',            ad.clarification_round, ','
           '"reason":"Missing supporting documents"'
           '}'),
    DATE_SUB(@ts, INTERVAL (t.id % 30 + 5) DAY)
FROM asset_declarations ad
JOIN temples t ON t.id = ad.temple_id
WHERE ad.status = 'CLARIFICATION_REQUESTED' AND ad.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM audit_data_events ae
        WHERE ae.entity_type = 'ASSET_DECLARATION' AND ae.entity_id = ad.id
          AND ae.action = 'REQUEST_CLARIFICATION'
    );

-- =============================================================================
-- SECTION 9: EMPLOYEE CREATE EVENTS (head priests and admins)
-- =============================================================================
INSERT INTO audit_data_events (
    actor_id, actor_role, action, entity_type, entity_id, detail, occurred_at
)
SELECT
    @sys,
    'DISTRICT_COLLECTOR',
    'CREATE',
    'EMPLOYEE',
    e.id,
    CONCAT('{"action":"CREATE",'
           '"templeId":',      e.temple_id, ','
           '"employeeType":"', e.employee_type, '",'
           '"designation":"',  REPLACE(COALESCE(e.designation, ''), '"', '\\"'), '",'
           '"ref":"',          COALESCE(e.employee_ref, ''), '"'
           '}'),
    e.created_at
FROM employees e
WHERE e.designation IN ('Head Priest', 'Executive Officer', 'Accounts Officer') AND e.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM audit_data_events ae
        WHERE ae.entity_type = 'EMPLOYEE' AND ae.entity_id = e.id AND ae.action = 'CREATE'
    )
LIMIT 2000;

-- =============================================================================
-- SECTION 10: EMPLOYEE TERMINATE EVENTS (resigned/retired employees)
-- =============================================================================
INSERT INTO audit_data_events (
    actor_id, actor_role, action, entity_type, entity_id, detail, occurred_at
)
SELECT
    @sys,
    'DISTRICT_COLLECTOR',
    'TERMINATE',
    'EMPLOYEE',
    e.id,
    CONCAT('{"action":"TERMINATE",'
           '"templeId":',          e.temple_id, ','
           '"status":"',           e.status, '",'
           '"dateOfLeaving":"',    COALESCE(CAST(e.date_of_leaving AS CHAR), 'unknown'), '"'
           '}'),
    COALESCE(e.date_of_leaving, DATE_SUB(@ts, INTERVAL 30 DAY))
FROM employees e
WHERE e.status IN ('RESIGNED', 'RETIRED') AND e.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM audit_data_events ae
        WHERE ae.entity_type = 'EMPLOYEE' AND ae.entity_id = e.id AND ae.action = 'TERMINATE'
    );

-- =============================================================================
-- SECTION 11: CONTRACTOR CREATE EVENTS
-- =============================================================================
INSERT INTO audit_data_events (
    actor_id, actor_role, action, entity_type, entity_id, detail, occurred_at
)
SELECT
    @sys,
    'DISTRICT_COLLECTOR',
    'CREATE',
    'CONTRACTOR',
    c.id,
    CONCAT('{"action":"CREATE",'
           '"templeId":',         c.temple_id, ','
           '"contractorName":"',  REPLACE(COALESCE(c.name, ''), '"', '\\"'), '",'
           '"serviceType":"',     REPLACE(COALESCE(c.service_type, ''), '"', '\\"'), '",'
           '"contractValue":',    COALESCE(c.contract_value, 0), ','
           '"ref":"',             COALESCE(c.contract_reference, ''), '"'
           '}'),
    c.created_at
FROM contractors c
WHERE c.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM audit_data_events ae
        WHERE ae.entity_type = 'CONTRACTOR' AND ae.entity_id = c.id AND ae.action = 'CREATE'
    );

-- =============================================================================
-- SECTION 12: DOCUMENT UPLOAD EVENTS
-- =============================================================================
INSERT INTO audit_data_events (
    actor_id, actor_role, action, entity_type, entity_id, detail, occurred_at
)
SELECT
    @sys,
    'TEMPLE_AUTHORITY',
    'UPLOAD',
    'DOCUMENT',
    d.id,
    CONCAT('{"action":"UPLOAD",'
           '"ownerType":"',       d.owner_type, '",'
           '"ownerId":',          d.owner_id, ','
           '"documentLabel":"',   REPLACE(COALESCE(d.document_label, ''), '"', '\\"'), '",'
           '"fileName":"',        d.original_filename, '",'
           '"fileSizeBytes":',    d.file_size_bytes, ''
           '}'),
    d.created_at
FROM documents d
WHERE d.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM audit_data_events ae
        WHERE ae.entity_type = 'DOCUMENT' AND ae.entity_id = d.id AND ae.action = 'UPLOAD'
    )
LIMIT 5000;

-- =============================================================================
-- SECTION 13: AUTH EVENTS — Login history for DC and staff users
-- =============================================================================
INSERT INTO audit_auth_events (
    user_id, username, event_type, ip_address, outcome, detail, occurred_at
)
SELECT
    u.id,
    u.username,
    'LOGIN',
    CONCAT('10.', (u.id % 255), '.', (u.id * 7 % 255), '.', (u.id * 11 % 255)),
    'SUCCESS',
    CONCAT('Login from web portal — role: ', u.role),
    DATE_SUB(@ts, INTERVAL (u.id % 30) DAY)
FROM users u
WHERE u.is_active = 1 AND u.is_deleted = 0

UNION ALL

-- A few failed attempts (edge case for lock-out testing)
SELECT
    u.id,
    u.username,
    'LOGIN_FAILED',
    '203.127.56.12',
    'FAILURE',
    'Invalid password — attempt 1',
    DATE_SUB(@ts, INTERVAL (u.id % 14 + 1) DAY)
FROM users u
WHERE u.id % 5 = 0 AND u.is_active = 1 AND u.is_deleted = 0

UNION ALL

SELECT
    u.id,
    u.username,
    'LOGOUT',
    CONCAT('10.', (u.id % 255), '.', (u.id * 7 % 255), '.', (u.id * 11 % 255)),
    'SUCCESS',
    CONCAT('Session ended — role: ', u.role),
    DATE_SUB(@ts, INTERVAL (u.id % 30 - 1) DAY)
FROM users u
WHERE u.is_active = 1 AND u.is_deleted = 0;

-- =============================================================================
-- SECTION 14: EXPORT EVENTS — CSV export history by DC users
-- =============================================================================
INSERT INTO audit_export_events (
    actor_id, actor_role, export_type, filter_summary, record_count, occurred_at
)
SELECT
    u.id,
    u.role,
    ELT(1 + (u.id % 4), 'TEMPLE_LIST', 'DECLARATION_SUMMARY', 'EMPLOYEE_REPORT', 'CONTRACTOR_LIST'),
    CONCAT('{"districtId":', COALESCE(u.district_id, 1),
           ',"status":"APPROVED","financialYear":"2024-25"}'),
    ROUND((u.id % 100 + 20)),
    DATE_SUB(@ts, INTERVAL (u.id % 60) DAY)
FROM users u
WHERE u.role IN ('DISTRICT_COLLECTOR', 'DC_STAFF', 'SUPER_ADMIN')
  AND u.is_deleted = 0

UNION ALL

-- Second export per DC (quarterly reports)
SELECT
    u.id,
    u.role,
    ELT(1 + (u.id % 3), 'OVERDUE_DECLARATIONS', 'PENDING_PROFILE_REVIEW', 'ASSET_VALUATION_REPORT'),
    CONCAT('{"districtId":', COALESCE(u.district_id, 1), ',"quarter":"Q4-2024-25"}'),
    ROUND((u.id % 50 + 10)),
    DATE_SUB(@ts, INTERVAL (u.id % 30 + 30) DAY)
FROM users u
WHERE u.role IN ('DISTRICT_COLLECTOR', 'SUPER_ADMIN') AND u.is_deleted = 0;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- Verification:
-- SELECT action, COUNT(*) FROM audit_data_events GROUP BY action ORDER BY action;
-- SELECT entity_type, COUNT(*) FROM audit_data_events GROUP BY entity_type;
-- SELECT event_type, outcome, COUNT(*) FROM audit_auth_events GROUP BY event_type, outcome;
-- SELECT export_type, COUNT(*) FROM audit_export_events GROUP BY export_type;
-- =============================================================================
