-- V17: Development seed data — geo hierarchy + dev users
-- Password for all accounts: password123
-- BCrypt hash (strength 12): $2a$12$Jh5AwLDdLLbuS.Otkb0AK.2aFveu2vjEBCOYKEDKEYk757A2yNrQS
-- ─────────────────────────────────────────────────────────────────

-- ── Geo hierarchy ────────────────────────────────────────────────

INSERT IGNORE INTO states (id, name, code, is_deleted, created_at, updated_at, created_by, updated_by)
VALUES (1, 'Karnataka', 'KA', 0, NOW(), NOW(), 1, 1);

INSERT IGNORE INTO cities (id, state_id, name, is_deleted, created_at, updated_at, created_by, updated_by)
VALUES (1, 1, 'Mysuru', 0, NOW(), NOW(), 1, 1);

INSERT IGNORE INTO districts (id, city_id, name, is_deleted, created_at, updated_at, created_by, updated_by)
VALUES
    (1, 1, 'Mysuru',          0, NOW(), NOW(), 1, 1),
    (2, 1, 'Mandya',          0, NOW(), NOW(), 1, 1),
    (3, 1, 'Chamarajanagar',  0, NOW(), NOW(), 1, 1);

INSERT IGNORE INTO taluks (id, district_id, name, is_deleted, created_at, updated_at, created_by, updated_by)
VALUES
    (1, 1, 'Mysuru Taluk',         0, NOW(), NOW(), 1, 1),
    (2, 2, 'Mandya Taluk',         0, NOW(), NOW(), 1, 1),
    (3, 3, 'Chamarajanagar Taluk', 0, NOW(), NOW(), 1, 1);

INSERT IGNORE INTO hoblis (id, taluk_id, name, is_deleted, created_at, updated_at, created_by, updated_by)
VALUES
    (1, 1, 'Chamundi Hobli', 0, NOW(), NOW(), 1, 1),
    (2, 2, 'Mandya Hobli',   0, NOW(), NOW(), 1, 1),
    (3, 3, 'Kollegal Hobli', 0, NOW(), NOW(), 1, 1);

-- ── Dev users (password: password123) ────────────────────────────

INSERT IGNORE INTO users (
    id, username, email, password_hash, full_name, mobile, role,
    district_id, temple_id, mfa_type, is_active, aadhaar_verified,
    failed_login_count, is_deleted, created_at, updated_at, created_by, updated_by
) VALUES
-- Super Admin
(1, 'super_admin', 'admin@templeregistry.dev',
 '$2a$12$Jh5AwLDdLLbuS.Otkb0AK.2aFveu2vjEBCOYKEDKEYk757A2yNrQS',
 'Super Administrator', '9000000001', 'SUPER_ADMIN',
 NULL, NULL, 'NONE', 1, 1, 0, 0, NOW(), NOW(), 1, 1),

-- District Collector — Mysuru
(2, 'dc_mysuru', 'dc@templeregistry.dev',
 '$2a$12$Jh5AwLDdLLbuS.Otkb0AK.2aFveu2vjEBCOYKEDKEYk757A2yNrQS',
 'District Collector Mysuru', '9000000002', 'DISTRICT_COLLECTOR',
 1, NULL, 'NONE', 1, 1, 0, 0, NOW(), NOW(), 1, 1),

-- DC Staff — Mysuru
(3, 'dc_staff_mysuru', 'staff@templeregistry.dev',
 '$2a$12$Jh5AwLDdLLbuS.Otkb0AK.2aFveu2vjEBCOYKEDKEYk757A2yNrQS',
 'DC Staff Mysuru', '9000000003', 'DC_STAFF',
 1, NULL, 'NONE', 1, 1, 0, 0, NOW(), NOW(), 1, 1),

-- Temple Authority (no temple linked yet)
(4, 'ta_chamundi', 'ta@templeregistry.dev',
 '$2a$12$Jh5AwLDdLLbuS.Otkb0AK.2aFveu2vjEBCOYKEDKEYk757A2yNrQS',
 'Temple Authority Chamundi', '9000000004', 'TEMPLE_AUTHORITY',
 NULL, NULL, 'NONE', 1, 1, 0, 0, NOW(), NOW(), 1, 1),

-- Auditor
(5, 'auditor_dev', 'auditor@templeregistry.dev',
 '$2a$12$Jh5AwLDdLLbuS.Otkb0AK.2aFveu2vjEBCOYKEDKEYk757A2yNrQS',
 'Auditor Dev', '9000000005', 'AUDITOR',
 NULL, NULL, 'NONE', 1, 1, 0, 0, NOW(), NOW(), 1, 1);
