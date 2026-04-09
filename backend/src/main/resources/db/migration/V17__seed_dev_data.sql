-- V17: Seed data for local development
-- Creates geo hierarchy, a sample temple, and one user per role.
-- Password for all users: Password@123
-- ─────────────────────────────────────────────────────────────────

-- ── Geo hierarchy ────────────────────────────────────────────────
INSERT IGNORE INTO states (id, name, code) VALUES (1, 'Karnataka', 'KA');

INSERT IGNORE INTO cities (id, state_id, name) VALUES (1, 1, 'Bengaluru');

INSERT IGNORE INTO districts (id, city_id, name)
VALUES (1, 1, 'Bengaluru Urban');

-- ── Sample temple ────────────────────────────────────────────────
INSERT IGNORE INTO temples (id, name, grade, tradition, district_id, city, is_deleted, trust_registered, version)
VALUES (1, 'Sri Ganesha Temple', 'B', 'SHAIVITE', 1, 'Bengaluru', 0, 0, 0);

INSERT IGNORE INTO temple_search_summary (temple_id, name, grade, tradition, district_id, district_name, city, trust_registered)
VALUES (1, 'Sri Ganesha Temple', 'B', 'SHAIVITE', 1, 'Bengaluru Urban', 'Bengaluru', 0);

-- ── Seed users (password: Password@123, bcrypt cost 10) ──────────

-- Super Admin (not linked to district or temple)
INSERT IGNORE INTO users (
    id, username, email, password_hash, full_name, mobile,
    role, district_id, temple_id, mfa_type, is_active, aadhaar_verified
) VALUES (
    1, 'superadmin', 'superadmin@temple.gov.in',
    '$2a$10$6Me7D7yo8vbxp7ghwJed5u7vnTY3ChwtnnnmmuVVkwCSNSGignF7e',
    'Super Admin', '9000000001',
    'SUPER_ADMIN', NULL, NULL, 'NONE', 1, 1
);

-- District Collector (linked to district 1)
INSERT IGNORE INTO users (
    id, username, email, password_hash, full_name, mobile,
    role, district_id, temple_id, mfa_type, is_active, aadhaar_verified
) VALUES (
    2, 'dc_blr', 'dc@blr.gov.in',
    '$2a$10$6Me7D7yo8vbxp7ghwJed5u7vnTY3ChwtnnnmmuVVkwCSNSGignF7e',
    'DC Bengaluru Urban', '9000000002',
    'DISTRICT_COLLECTOR', 1, NULL, 'NONE', 1, 1
);

-- Temple Authority (linked to temple 1, district 1)
INSERT IGNORE INTO users (
    id, username, email, password_hash, full_name, mobile,
    role, district_id, temple_id, mfa_type, is_active, aadhaar_verified
) VALUES (
    3, 'ta_ganesha', 'ta@ganeshatemple.in',
    '$2a$10$6Me7D7yo8vbxp7ghwJed5u7vnTY3ChwtnnnmmuVVkwCSNSGignF7e',
    'Sri Ganesha Temple Authority', '9000000003',
    'TEMPLE_AUTHORITY', 1, 1, 'NONE', 1, 1
);
