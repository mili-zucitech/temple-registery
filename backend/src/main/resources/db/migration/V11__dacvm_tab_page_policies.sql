-- ============================================================================
-- V11: DACVM seed policies — temple profile tabs + sidebar pages
-- Adds explicit ALLOW seeds for all known tabs/pages, then applies DENY
-- policies for roles that should NOT have access to sensitive data.
--
-- Key rules:
--   • SA is always exempt from DENY (enforced in PolicyEvaluationServiceImpl).
--   • INSERT IGNORE keeps idempotent — safe to re-run.
--   • DENY policies are additive restrictions on top of @PreAuthorize.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Section 1: ALLOW seeds — DC temple profile tabs (all 7 tabs)
-- These register the target keys so they appear in the access matrix UI.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT IGNORE INTO access_control_policies
    (target_type, target_key, subject_type, subject_value, effect, is_active, created_by, updated_by)
VALUES
    -- Overview tab — all DC-capable roles
    ('TAB', 'tab.dc.temple.overview',        'ROLE', 'DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.overview',        'ROLE', 'DC_STAFF',           'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.overview',        'ROLE', 'AUDITOR',            'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.overview',        'ROLE', 'VIEWER',             'ALLOW', 1, 0, 0),
    -- Declarations tab — DC-level roles
    ('TAB', 'tab.dc.temple.declarations',    'ROLE', 'AUDITOR',            'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.declarations',    'ROLE', 'VIEWER',             'ALLOW', 1, 0, 0),
    -- Trust & Board tab
    ('TAB', 'tab.dc.temple.trust',           'ROLE', 'AUDITOR',            'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.trust',           'ROLE', 'VIEWER',             'ALLOW', 1, 0, 0),
    -- Staff tab
    ('TAB', 'tab.dc.temple.staff',           'ROLE', 'DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.staff',           'ROLE', 'DC_STAFF',           'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.staff',           'ROLE', 'AUDITOR',            'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.staff',           'ROLE', 'VIEWER',             'ALLOW', 1, 0, 0),
    -- Contractors tab
    ('TAB', 'tab.dc.temple.contractors',     'ROLE', 'DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.contractors',     'ROLE', 'DC_STAFF',           'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.contractors',     'ROLE', 'AUDITOR',            'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.contractors',     'ROLE', 'VIEWER',             'ALLOW', 1, 0, 0),
    -- Documents tab
    ('TAB', 'tab.dc.temple.documents',       'ROLE', 'DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.documents',       'ROLE', 'DC_STAFF',           'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.documents',       'ROLE', 'AUDITOR',            'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.documents',       'ROLE', 'VIEWER',             'ALLOW', 1, 0, 0),
    -- Timeline tab — read-only activity log, open to all
    ('TAB', 'tab.dc.temple.timeline',        'ROLE', 'DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.timeline',        'ROLE', 'DC_STAFF',           'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.timeline',        'ROLE', 'AUDITOR',            'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.timeline',        'ROLE', 'VIEWER',             'ALLOW', 1, 0, 0),
    -- Profile History tab — DC audit tab (staging/version history)
    ('TAB', 'tab.dc.temple.profile_history', 'ROLE', 'DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.profile_history', 'ROLE', 'DC_STAFF',           'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.profile_history', 'ROLE', 'AUDITOR',            'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.profile_history', 'ROLE', 'VIEWER',             'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.profile_history', 'ROLE', 'TEMPLE_AUTHORITY',   'ALLOW', 1, 0, 0);

-- ─────────────────────────────────────────────────────────────────────────────
-- Section 2: ALLOW seeds — TA own-temple page tabs
-- ─────────────────────────────────────────────────────────────────────────────
INSERT IGNORE INTO access_control_policies
    (target_type, target_key, subject_type, subject_value, effect, is_active, created_by, updated_by)
VALUES
    ('TAB', 'tab.ta.temple.overview',        'ROLE', 'TEMPLE_AUTHORITY',   'ALLOW', 1, 0, 0),
    ('TAB', 'tab.ta.temple.history',         'ROLE', 'TEMPLE_AUTHORITY',   'ALLOW', 1, 0, 0),
    ('TAB', 'tab.ta.temple.timeline',        'ROLE', 'TEMPLE_AUTHORITY',   'ALLOW', 1, 0, 0);

-- ─────────────────────────────────────────────────────────────────────────────
-- Section 3: ALLOW seeds — Sidebar pages (all roles that can access each page)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT IGNORE INTO access_control_policies
    (target_type, target_key, subject_type, subject_value, effect, is_active, created_by, updated_by)
VALUES
    -- Admin pages
    ('PAGE', 'page.admin.dashboard',         'ROLE', 'SUPER_ADMIN',        'ALLOW', 1, 0, 0),
    ('PAGE', 'page.admin.users',             'ROLE', 'SUPER_ADMIN',        'ALLOW', 1, 0, 0),
    ('PAGE', 'page.admin.audit',             'ROLE', 'SUPER_ADMIN',        'ALLOW', 1, 0, 0),
    ('PAGE', 'page.admin.geo',               'ROLE', 'SUPER_ADMIN',        'ALLOW', 1, 0, 0),
    ('PAGE', 'page.admin.system_config',     'ROLE', 'SUPER_ADMIN',        'ALLOW', 1, 0, 0),
    ('PAGE', 'page.admin.notification_rules','ROLE', 'SUPER_ADMIN',        'ALLOW', 1, 0, 0),
    ('PAGE', 'page.admin.access_control',    'ROLE', 'SUPER_ADMIN',        'ALLOW', 1, 0, 0),
    ('PAGE', 'page.admin.governance',        'ROLE', 'SUPER_ADMIN',        'ALLOW', 1, 0, 0),
    -- DC pages
    ('PAGE', 'page.dc.dashboard',            'ROLE', 'DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    ('PAGE', 'page.dc.dashboard',            'ROLE', 'DC_STAFF',           'ALLOW', 1, 0, 0),
    ('PAGE', 'page.dc.workflow',             'ROLE', 'DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    ('PAGE', 'page.dc.workflow',             'ROLE', 'DC_STAFF',           'ALLOW', 1, 0, 0),
    ('PAGE', 'page.dc.activity',             'ROLE', 'DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    ('PAGE', 'page.dc.activity',             'ROLE', 'DC_STAFF',           'ALLOW', 1, 0, 0),
    -- Auditor pages
    ('PAGE', 'page.auditor.dashboard',       'ROLE', 'AUDITOR',            'ALLOW', 1, 0, 0),
    ('PAGE', 'page.auditor.observations',    'ROLE', 'AUDITOR',            'ALLOW', 1, 0, 0),
    ('PAGE', 'page.auditor.observations',    'ROLE', 'VIEWER',             'ALLOW', 1, 0, 0),
    ('PAGE', 'page.auditor.audit_trail',     'ROLE', 'AUDITOR',            'ALLOW', 1, 0, 0),
    ('PAGE', 'page.auditor.audit_trail',     'ROLE', 'VIEWER',             'ALLOW', 1, 0, 0),
    -- Viewer pages
    ('PAGE', 'page.viewer.dashboard',        'ROLE', 'VIEWER',             'ALLOW', 1, 0, 0),
    -- TA pages
    ('PAGE', 'page.ta.dashboard',            'ROLE', 'TEMPLE_AUTHORITY',   'ALLOW', 1, 0, 0),
    ('PAGE', 'page.ta.trust',                'ROLE', 'TEMPLE_AUTHORITY',   'ALLOW', 1, 0, 0),
    ('PAGE', 'page.ta.employees',            'ROLE', 'TEMPLE_AUTHORITY',   'ALLOW', 1, 0, 0),
    ('PAGE', 'page.ta.contractors',          'ROLE', 'TEMPLE_AUTHORITY',   'ALLOW', 1, 0, 0),
    ('PAGE', 'page.ta.documents',            'ROLE', 'TEMPLE_AUTHORITY',   'ALLOW', 1, 0, 0),
    ('PAGE', 'page.ta.declarations',         'ROLE', 'TEMPLE_AUTHORITY',   'ALLOW', 1, 0, 0);

-- ─────────────────────────────────────────────────────────────────────────────
-- Section 4: DENY policies — Temple profile tabs (sensitive data restriction)
--
-- Trust & Board: DENY for VIEWER (board member contact / financial data)
-- Staff:         DENY for VIEWER (employee personal data), DC_STAFF (read-only
--                DC staff should not view full employee records)
-- Contractors:   DENY for VIEWER (contractor contract amounts are private)
-- Documents:     DENY for VIEWER (official temple docs — audit trail required)
-- Profile Hist.: DENY for VIEWER, TEMPLE_AUTHORITY (DC-internal audit view)
-- Declarations:  DENY for VIEWER (declaration financials are restricted)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT IGNORE INTO access_control_policies
    (target_type, target_key, subject_type, subject_value, effect, is_active, created_by, updated_by)
VALUES
    -- Trust & Board: Viewer cannot see board composition
    ('TAB', 'tab.dc.temple.trust',           'ROLE', 'VIEWER',             'DENY',  1, 0, 0),
    -- Staff: Viewer & DC Staff cannot see full employee records
    ('TAB', 'tab.dc.temple.staff',           'ROLE', 'VIEWER',             'DENY',  1, 0, 0),
    ('TAB', 'tab.dc.temple.staff',           'ROLE', 'DC_STAFF',           'DENY',  1, 0, 0),
    -- Contractors: Viewer cannot see contractor detail / amounts
    ('TAB', 'tab.dc.temple.contractors',     'ROLE', 'VIEWER',             'DENY',  1, 0, 0),
    -- Documents: Viewer cannot browse temple documents
    ('TAB', 'tab.dc.temple.documents',       'ROLE', 'VIEWER',             'DENY',  1, 0, 0),
    -- Profile History: Viewer & TA cannot see DC-internal staging history
    ('TAB', 'tab.dc.temple.profile_history', 'ROLE', 'VIEWER',             'DENY',  1, 0, 0),
    ('TAB', 'tab.dc.temple.profile_history', 'ROLE', 'TEMPLE_AUTHORITY',   'DENY',  1, 0, 0),
    -- Declarations: Viewer cannot access declaration financials
    ('TAB', 'tab.dc.temple.declarations',    'ROLE', 'VIEWER',             'DENY',  1, 0, 0);

-- ─────────────────────────────────────────────────────────────────────────────
-- Section 5: DENY policies — Sidebar pages
--
-- Export page:    DENY for DC_STAFF (bulk data export is DC privilege only)
-- Workflow page:  DENY for DC_STAFF (workflow approval authority is DC only)
-- Auditor Trail:  DENY for VIEWER (enforcement audit trail is confidential)
-- Observations:   DENY for VIEWER (auditor work product, not public-facing)
-- Admin Audit:    DENY for DC_STAFF (admin audit log is SA-restricted)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT IGNORE INTO access_control_policies
    (target_type, target_key, subject_type, subject_value, effect, is_active, created_by, updated_by)
VALUES
    -- Export page: DC Staff cannot export bulk data
    ('PAGE', 'page.dc.export',               'ROLE', 'DC_STAFF',           'DENY',  1, 0, 0),
    -- Workflow dashboard: DC Staff cannot access approval workflow
    ('PAGE', 'page.dc.workflow',             'ROLE', 'DC_STAFF',           'DENY',  1, 0, 0),
    -- Auditor Audit Trail: Viewer cannot see enforcement audit trail
    ('PAGE', 'page.auditor.audit_trail',     'ROLE', 'VIEWER',             'DENY',  1, 0, 0),
    -- Auditor Observations: Viewer cannot access auditor observations
    ('PAGE', 'page.auditor.observations',    'ROLE', 'VIEWER',             'DENY',  1, 0, 0),
    -- Admin Audit Logs: DC Staff cannot access admin audit logs
    ('PAGE', 'page.admin.audit',             'ROLE', 'DC_STAFF',           'DENY',  1, 0, 0);
