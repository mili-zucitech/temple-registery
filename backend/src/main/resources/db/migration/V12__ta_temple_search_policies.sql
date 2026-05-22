-- ============================================================================
-- V12: DACVM seed policies — TA temple search page and district profile tabs
--
-- Adds explicit ALLOW seeds for:
--   1. TA sidebar "Temple Search" page key
--   2. TA temple search KPI cards (ComplianceStrip tiles)
--   3. DC temple profile tabs visible to TEMPLE_AUTHORITY role
--      (fail-open already, but explicit seeds make them visible in the
--       access-matrix UI so SUPER_ADMIN can manage them per role)
--
-- Key rules:
--   • SA is always exempt from DENY (enforced in PolicyEvaluationServiceImpl).
--   • INSERT IGNORE is idempotent — safe to re-run.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Section 1: TA Temple Search sidebar page
-- ─────────────────────────────────────────────────────────────────────────────
INSERT IGNORE INTO access_control_policies
    (target_type, target_key, subject_type, subject_value, effect, is_active, created_by, updated_by)
VALUES
    ('PAGE', 'page.ta.temple_search', 'ROLE', 'TEMPLE_AUTHORITY', 'ALLOW', 1, 0, 0);

-- ─────────────────────────────────────────────────────────────────────────────
-- Section 2: TA temple search KPI card visibility
-- ─────────────────────────────────────────────────────────────────────────────
INSERT IGNORE INTO access_control_policies
    (target_type, target_key, subject_type, subject_value, effect, is_active, created_by, updated_by)
VALUES
    ('KPI_CARD', 'kpi.ta.search.total_temples',   'ROLE', 'TEMPLE_AUTHORITY', 'ALLOW', 1, 0, 0),
    ('KPI_CARD', 'kpi.ta.search.overdue',         'ROLE', 'TEMPLE_AUTHORITY', 'ALLOW', 1, 0, 0),
    ('KPI_CARD', 'kpi.ta.search.pending',         'ROLE', 'TEMPLE_AUTHORITY', 'ALLOW', 1, 0, 0),
    ('KPI_CARD', 'kpi.ta.search.profile_reviews', 'ROLE', 'TEMPLE_AUTHORITY', 'ALLOW', 1, 0, 0);

-- ─────────────────────────────────────────────────────────────────────────────
-- Section 4: Temple Search filter section visibility
--
-- Declaration Status and Trust Registration filter panels in the search sidebar.
-- Both DC and TA roles see these filters; SUPER_ADMIN can DENY per role.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT IGNORE INTO access_control_policies
    (target_type, target_key, subject_type, subject_value, effect, is_active, created_by, updated_by)
VALUES
    -- DC search page filter sections
    ('SECTION', 'section.dc.search.declaration_status', 'ROLE', 'DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    ('SECTION', 'section.dc.search.declaration_status', 'ROLE', 'DC_STAFF',           'ALLOW', 1, 0, 0),
    ('SECTION', 'section.dc.search.trust_registered',   'ROLE', 'DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    ('SECTION', 'section.dc.search.trust_registered',   'ROLE', 'DC_STAFF',           'ALLOW', 1, 0, 0),
    ('SECTION', 'section.dc.search.saved_filters',      'ROLE', 'DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    ('SECTION', 'section.dc.search.saved_filters',      'ROLE', 'DC_STAFF',           'ALLOW', 1, 0, 0),
    ('SECTION', 'section.dc.search.card_status',        'ROLE', 'DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    ('SECTION', 'section.dc.search.card_status',        'ROLE', 'DC_STAFF',           'ALLOW', 1, 0, 0),
    ('SECTION', 'section.dc.search.card_trust',         'ROLE', 'DISTRICT_COLLECTOR', 'ALLOW', 1, 0, 0),
    ('SECTION', 'section.dc.search.card_trust',         'ROLE', 'DC_STAFF',           'ALLOW', 1, 0, 0),
    -- TA search page filter sections
    ('SECTION', 'section.ta.search.declaration_status', 'ROLE', 'TEMPLE_AUTHORITY',   'ALLOW', 1, 0, 0),
    ('SECTION', 'section.ta.search.trust_registered',   'ROLE', 'TEMPLE_AUTHORITY',   'ALLOW', 1, 0, 0),
    ('SECTION', 'section.ta.search.saved_filters',      'ROLE', 'TEMPLE_AUTHORITY',   'ALLOW', 1, 0, 0),
    ('SECTION', 'section.ta.search.card_status',        'ROLE', 'TEMPLE_AUTHORITY',   'ALLOW', 1, 0, 0),
    ('SECTION', 'section.ta.search.card_trust',         'ROLE', 'TEMPLE_AUTHORITY',   'ALLOW', 1, 0, 0);
--
-- TA accesses DcTempleProfilePage via the shared /dc/temples/:id route.
-- Explicit ALLOW seeds make these keys visible in the access-matrix UI.
-- SUPER_ADMIN can then apply per-role DENY to restrict sensitive tabs.
-- profile_history is excluded — it has an existing DENY for TA in V11.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT IGNORE INTO access_control_policies
    (target_type, target_key, subject_type, subject_value, effect, is_active, created_by, updated_by)
VALUES
    ('TAB', 'tab.dc.temple.overview',     'ROLE', 'TEMPLE_AUTHORITY', 'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.declarations', 'ROLE', 'TEMPLE_AUTHORITY', 'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.trust',        'ROLE', 'TEMPLE_AUTHORITY', 'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.staff',        'ROLE', 'TEMPLE_AUTHORITY', 'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.contractors',  'ROLE', 'TEMPLE_AUTHORITY', 'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.documents',    'ROLE', 'TEMPLE_AUTHORITY', 'ALLOW', 1, 0, 0),
    ('TAB', 'tab.dc.temple.timeline',     'ROLE', 'TEMPLE_AUTHORITY', 'ALLOW', 1, 0, 0);
