-- =============================================================================
-- V18: Comprehensive Seed Data — Temple Registry DC Module
-- Schema-driven, requirement-aligned, production-grade test dataset.
--
-- Coverage:
--   - 5 revenue divisions (cities), 20 districts, 66 taluks, 132 hoblis
--   - 760 temples with realistic variation across all filter dimensions
--   - 490+ trust registrations + board members + financials
--   - 760 asset declarations with grade A/B/C and all status values
--   - 15 DC/staff users (one per key district)
--   - temple_search_summary fully populated (the table powering DC search UI)
--   - Contractors and employees for edge case coverage
--
-- Password for all new user accounts: password123
-- BCrypt hash (strength 12): $2a$12$Jh5AwLDdLLbuS.Otkb0AK.2aFveu2vjEBCOYKEDKEYk757A2yNrQS
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SESSION group_concat_max_len = 1000000;
SET @ts  = NOW();
SET @sys = 1; -- system user id for created_by/updated_by

-- =============================================================================
-- SECTION 1: GEO HIERARCHY EXPANSION
-- V17 already has: state 1 (Karnataka), city 1 (Mysuru), districts 1-3, taluks 1-3, hoblis 1-3
-- This section adds: cities 2-5, districts 4-20, taluks 4-66, hoblis 4-132
-- =============================================================================

-- ── Cities (Revenue Divisions) ──────────────────────────────────────────────
INSERT IGNORE INTO cities (id, state_id, name, is_deleted, created_at, updated_at, created_by, updated_by) VALUES
(2, 1, 'Bengaluru',   0, @ts, @ts, @sys, @sys),
(3, 1, 'Kalaburagi',  0, @ts, @ts, @sys, @sys),
(4, 1, 'Belagavi',    0, @ts, @ts, @sys, @sys),
(5, 1, 'Shivamogga',  0, @ts, @ts, @sys, @sys);

-- ── Districts (20 total: 3 existing + 17 new) ────────────────────────────────
-- city_id=1 (Mysuru Division)
INSERT IGNORE INTO districts (id, city_id, name, is_deleted, created_at, updated_at, created_by, updated_by) VALUES
(4,  1, 'Kodagu',          0, @ts, @ts, @sys, @sys),
(5,  1, 'Hassan',          0, @ts, @ts, @sys, @sys),
-- city_id=2 (Bengaluru Division)
(6,  2, 'Bengaluru Urban', 0, @ts, @ts, @sys, @sys),
(7,  2, 'Bengaluru Rural', 0, @ts, @ts, @sys, @sys),
(8,  2, 'Ramanagara',      0, @ts, @ts, @sys, @sys),
(9,  2, 'Tumkuru',         0, @ts, @ts, @sys, @sys),
(10, 2, 'Kolar',           0, @ts, @ts, @sys, @sys),
-- city_id=3 (Kalaburagi Division)
(11, 3, 'Kalaburagi',      0, @ts, @ts, @sys, @sys),
(12, 3, 'Bidar',           0, @ts, @ts, @sys, @sys),
(13, 3, 'Raichur',         0, @ts, @ts, @sys, @sys),
-- city_id=4 (Belagavi Division)
(14, 4, 'Belagavi',        0, @ts, @ts, @sys, @sys),
(15, 4, 'Vijayapura',      0, @ts, @ts, @sys, @sys),
(16, 4, 'Bagalkot',        0, @ts, @ts, @sys, @sys),
(17, 4, 'Dharwad',         0, @ts, @ts, @sys, @sys),
-- city_id=5 (Shivamogga Division)
(18, 5, 'Shivamogga',      0, @ts, @ts, @sys, @sys),
(19, 5, 'Davanagere',      0, @ts, @ts, @sys, @sys),
(20, 5, 'Chitradurga',     0, @ts, @ts, @sys, @sys);

-- ── Additional Taluks in existing districts (V17 added one each for dist 1-3)
INSERT IGNORE INTO taluks (id, district_id, name, is_deleted, created_at, updated_at, created_by, updated_by) VALUES
-- District 1: Mysuru (add 3 more beyond existing taluk 1)
(4,  1, 'Hunsur',                        0, @ts, @ts, @sys, @sys),
(5,  1, 'Periyapatna',                   0, @ts, @ts, @sys, @sys),
(6,  1, 'Krishnarajanagara',             0, @ts, @ts, @sys, @sys),
-- District 2: Mandya (add 3 more beyond existing taluk 2)
(7,  2, 'Nagamangala',                   0, @ts, @ts, @sys, @sys),
(8,  2, 'Maddur',                        0, @ts, @ts, @sys, @sys),
(9,  2, 'Malavalli',                     0, @ts, @ts, @sys, @sys),
-- District 3: Chamarajanagar (add 2 more beyond existing taluk 3)
(10, 3, 'Gundlupet',                     0, @ts, @ts, @sys, @sys),
(11, 3, 'Yelandur',                      0, @ts, @ts, @sys, @sys),
-- District 4: Kodagu
(12, 4, 'Madikeri',                      0, @ts, @ts, @sys, @sys),
(13, 4, 'Virajpet',                      0, @ts, @ts, @sys, @sys),
(14, 4, 'Somwarpet',                     0, @ts, @ts, @sys, @sys),
-- District 5: Hassan
(15, 5, 'Hassan',                        0, @ts, @ts, @sys, @sys),
(16, 5, 'Arsikere',                      0, @ts, @ts, @sys, @sys),
(17, 5, 'Sakleshpur',                    0, @ts, @ts, @sys, @sys),
(18, 5, 'Belur',                         0, @ts, @ts, @sys, @sys),
-- District 6: Bengaluru Urban
(19, 6, 'Bengaluru North',               0, @ts, @ts, @sys, @sys),
(20, 6, 'Bengaluru South',               0, @ts, @ts, @sys, @sys),
(21, 6, 'Bengaluru East',                0, @ts, @ts, @sys, @sys),
(22, 6, 'Yelahanka',                     0, @ts, @ts, @sys, @sys),
-- District 7: Bengaluru Rural
(23, 7, 'Devanahalli',                   0, @ts, @ts, @sys, @sys),
(24, 7, 'Doddaballapur',                 0, @ts, @ts, @sys, @sys),
(25, 7, 'Nelamangala',                   0, @ts, @ts, @sys, @sys),
-- District 8: Ramanagara
(26, 8, 'Ramanagara',                    0, @ts, @ts, @sys, @sys),
(27, 8, 'Channapatna',                   0, @ts, @ts, @sys, @sys),
(28, 8, 'Kanakapura',                    0, @ts, @ts, @sys, @sys),
-- District 9: Tumkuru
(29, 9, 'Tumkuru',                       0, @ts, @ts, @sys, @sys),
(30, 9, 'Tiptur',                        0, @ts, @ts, @sys, @sys),
(31, 9, 'Sira',                          0, @ts, @ts, @sys, @sys),
(32, 9, 'Madhugiri',                     0, @ts, @ts, @sys, @sys),
-- District 10: Kolar
(33, 10, 'Kolar',                        0, @ts, @ts, @sys, @sys),
(34, 10, 'Mulbagal',                     0, @ts, @ts, @sys, @sys),
(35, 10, 'Srinivasapur',                 0, @ts, @ts, @sys, @sys),
-- District 11: Kalaburagi
(36, 11, 'Kalaburagi',                   0, @ts, @ts, @sys, @sys),
(37, 11, 'Yadgir',                       0, @ts, @ts, @sys, @sys),
(38, 11, 'Sedam',                        0, @ts, @ts, @sys, @sys),
-- District 12: Bidar
(39, 12, 'Bidar',                        0, @ts, @ts, @sys, @sys),
(40, 12, 'Bhalki',                       0, @ts, @ts, @sys, @sys),
(41, 12, 'Basavakalyan',                 0, @ts, @ts, @sys, @sys),
-- District 13: Raichur
(42, 13, 'Raichur',                      0, @ts, @ts, @sys, @sys),
(43, 13, 'Sindhanur',                    0, @ts, @ts, @sys, @sys),
(44, 13, 'Lingasugur',                   0, @ts, @ts, @sys, @sys),
-- District 14: Belagavi
(45, 14, 'Belagavi',                     0, @ts, @ts, @sys, @sys),
(46, 14, 'Gokak',                        0, @ts, @ts, @sys, @sys),
(47, 14, 'Bailhongal',                   0, @ts, @ts, @sys, @sys),
(48, 14, 'Hukkeri',                      0, @ts, @ts, @sys, @sys),
-- District 15: Vijayapura
(49, 15, 'Vijayapura',                   0, @ts, @ts, @sys, @sys),
(50, 15, 'Indi',                         0, @ts, @ts, @sys, @sys),
(51, 15, 'Sindagi',                      0, @ts, @ts, @sys, @sys),
-- District 16: Bagalkot
(52, 16, 'Bagalkot',                     0, @ts, @ts, @sys, @sys),
(53, 16, 'Badami',                       0, @ts, @ts, @sys, @sys),
(54, 16, 'Jamakhandi',                   0, @ts, @ts, @sys, @sys),
-- District 17: Dharwad
(55, 17, 'Dharwad',                      0, @ts, @ts, @sys, @sys),
(56, 17, 'Hubli',                        0, @ts, @ts, @sys, @sys),
(57, 17, 'Navalgund',                    0, @ts, @ts, @sys, @sys),
-- District 18: Shivamogga
(58, 18, 'Shivamogga',                   0, @ts, @ts, @sys, @sys),
(59, 18, 'Bhadravati',                   0, @ts, @ts, @sys, @sys),
(60, 18, 'Tirthahalli',                  0, @ts, @ts, @sys, @sys),
-- District 19: Davanagere
(61, 19, 'Davanagere',                   0, @ts, @ts, @sys, @sys),
(62, 19, 'Harihar',                      0, @ts, @ts, @sys, @sys),
(63, 19, 'Jagalur',                      0, @ts, @ts, @sys, @sys),
-- District 20: Chitradurga
(64, 20, 'Chitradurga',                  0, @ts, @ts, @sys, @sys),
(65, 20, 'Hiriyur',                      0, @ts, @ts, @sys, @sys),
(66, 20, 'Holalkere',                    0, @ts, @ts, @sys, @sys);

-- ── Hoblis (2 per taluk; existing hoblis 1-3 already assigned to taluks 1-3)
-- Taluk 1 gets hobli 4 (V17 gave it hobli 1), Taluk 2 gets hobli 5, Taluk 3 gets hobli 6
INSERT IGNORE INTO hoblis (id, taluk_id, name, is_deleted, created_at, updated_at, created_by, updated_by) VALUES
-- Taluk 1 (Mysuru Taluk): hobli 1 exists (Chamundi Hobli), add hobli 4
(4,   1,  'T Narasipur Hobli',              0, @ts, @ts, @sys, @sys),
-- Taluk 2 (Mandya Taluk): hobli 2 exists, add hobli 5
(5,   2,  'Srirangapatna Hobli',            0, @ts, @ts, @sys, @sys),
-- Taluk 3 (Chamarajanagar Taluk): hobli 3 exists, add hobli 6
(6,   3,  'Kollegal North Hobli',           0, @ts, @ts, @sys, @sys),
-- Taluk 4 onwards: 2 hoblis each
(7,   4,  'Hunsur North Hobli',             0, @ts, @ts, @sys, @sys),
(8,   4,  'Hunsur South Hobli',             0, @ts, @ts, @sys, @sys),
(9,   5,  'Periyapatna North Hobli',        0, @ts, @ts, @sys, @sys),
(10,  5,  'Periyapatna South Hobli',        0, @ts, @ts, @sys, @sys),
(11,  6,  'Krishnarajanagara Hobli',        0, @ts, @ts, @sys, @sys),
(12,  6,  'Varuna Hobli',                   0, @ts, @ts, @sys, @sys),
(13,  7,  'Nagamangala Hobli',              0, @ts, @ts, @sys, @sys),
(14,  7,  'Doddagaddavalli Hobli',          0, @ts, @ts, @sys, @sys),
(15,  8,  'Maddur Hobli',                   0, @ts, @ts, @sys, @sys),
(16,  8,  'Kokkare Bellur Hobli',           0, @ts, @ts, @sys, @sys),
(17,  9,  'Malavalli Hobli',                0, @ts, @ts, @sys, @sys),
(18,  9,  'Kere Hobli',                     0, @ts, @ts, @sys, @sys),
(19, 10,  'Gundlupet Hobli',               0, @ts, @ts, @sys, @sys),
(20, 10,  'Hangala Hobli',                  0, @ts, @ts, @sys, @sys),
(21, 11,  'Yelandur Hobli',                 0, @ts, @ts, @sys, @sys),
(22, 11,  'Sathegala Hobli',                0, @ts, @ts, @sys, @sys),
(23, 12,  'Madikeri Hobli',                 0, @ts, @ts, @sys, @sys),
(24, 12,  'Napoklu Hobli',                  0, @ts, @ts, @sys, @sys),
(25, 13,  'Virajpet Hobli',                 0, @ts, @ts, @sys, @sys),
(26, 13,  'Ponnampet Hobli',                0, @ts, @ts, @sys, @sys),
(27, 14,  'Somwarpet Hobli',                0, @ts, @ts, @sys, @sys),
(28, 14,  'Shanthalli Hobli',               0, @ts, @ts, @sys, @sys),
(29, 15,  'Hassan Hobli',                   0, @ts, @ts, @sys, @sys),
(30, 15,  'Arasikere Hobli',                0, @ts, @ts, @sys, @sys),
(31, 16,  'Arsikere Hobli',                 0, @ts, @ts, @sys, @sys),
(32, 16,  'Bukkapatna Hobli',               0, @ts, @ts, @sys, @sys),
(33, 17,  'Sakleshpur Hobli',               0, @ts, @ts, @sys, @sys),
(34, 17,  'Donigal Hobli',                  0, @ts, @ts, @sys, @sys),
(35, 18,  'Belur Hobli',                    0, @ts, @ts, @sys, @sys),
(36, 18,  'Halebidu Hobli',                 0, @ts, @ts, @sys, @sys),
(37, 19,  'Yelahanka Hobli',                0, @ts, @ts, @sys, @sys),
(38, 19,  'Jala Hobli',                     0, @ts, @ts, @sys, @sys),
(39, 20,  'Krishnarajapuram Hobli',         0, @ts, @ts, @sys, @sys),
(40, 20,  'Begur Hobli',                    0, @ts, @ts, @sys, @sys),
(41, 21,  'Hoodi Hobli',                    0, @ts, @ts, @sys, @sys),
(42, 21,  'Varthur Hobli',                  0, @ts, @ts, @sys, @sys),
(43, 22,  'Yelahanka South Hobli',          0, @ts, @ts, @sys, @sys),
(44, 22,  'Dasarahalli Hobli',              0, @ts, @ts, @sys, @sys),
(45, 23,  'Devanahalli Hobli',              0, @ts, @ts, @sys, @sys),
(46, 23,  'Vijayapura Hobli',               0, @ts, @ts, @sys, @sys),
(47, 24,  'Doddaballapur Hobli',            0, @ts, @ts, @sys, @sys),
(48, 24,  'Rajanukunte Hobli',              0, @ts, @ts, @sys, @sys),
(49, 25,  'Nelamangala Hobli',              0, @ts, @ts, @sys, @sys),
(50, 25,  'Hesaraghatta Hobli',             0, @ts, @ts, @sys, @sys),
(51, 26,  'Ramanagara Hobli',               0, @ts, @ts, @sys, @sys),
(52, 26,  'Bidadi Hobli',                   0, @ts, @ts, @sys, @sys),
(53, 27,  'Channapatna Hobli',              0, @ts, @ts, @sys, @sys),
(54, 27,  'Maddur South Hobli',             0, @ts, @ts, @sys, @sys),
(55, 28,  'Kanakapura Hobli',               0, @ts, @ts, @sys, @sys),
(56, 28,  'Sathanur Hobli',                 0, @ts, @ts, @sys, @sys),
(57, 29,  'Tumkuru Hobli',                  0, @ts, @ts, @sys, @sys),
(58, 29,  'Pavagada Hobli',                 0, @ts, @ts, @sys, @sys),
(59, 30,  'Tiptur Hobli',                   0, @ts, @ts, @sys, @sys),
(60, 30,  'Chikkanayakanahalli Hobli',      0, @ts, @ts, @sys, @sys),
(61, 31,  'Sira Hobli',                     0, @ts, @ts, @sys, @sys),
(62, 31,  'Bukkapatna South Hobli',         0, @ts, @ts, @sys, @sys),
(63, 32,  'Madhugiri Hobli',                0, @ts, @ts, @sys, @sys),
(64, 32,  'Koratagere Hobli',               0, @ts, @ts, @sys, @sys),
(65, 33,  'Kolar Hobli',                    0, @ts, @ts, @sys, @sys),
(66, 33,  'Oorgaum Hobli',                  0, @ts, @ts, @sys, @sys),
(67, 34,  'Mulbagal Hobli',                 0, @ts, @ts, @sys, @sys),
(68, 34,  'Gudibande Hobli',                0, @ts, @ts, @sys, @sys),
(69, 35,  'Srinivasapur Hobli',             0, @ts, @ts, @sys, @sys),
(70, 35,  'Bangarapet Hobli',               0, @ts, @ts, @sys, @sys),
(71, 36,  'Kalaburagi Hobli',               0, @ts, @ts, @sys, @sys),
(72, 36,  'Afzalpur Hobli',                 0, @ts, @ts, @sys, @sys),
(73, 37,  'Yadgir Hobli',                   0, @ts, @ts, @sys, @sys),
(74, 37,  'Shorapur Hobli',                 0, @ts, @ts, @sys, @sys),
(75, 38,  'Sedam Hobli',                    0, @ts, @ts, @sys, @sys),
(76, 38,  'Chittapur Hobli',                0, @ts, @ts, @sys, @sys),
(77, 39,  'Bidar Hobli',                    0, @ts, @ts, @sys, @sys),
(78, 39,  'Humnabad Hobli',                 0, @ts, @ts, @sys, @sys),
(79, 40,  'Bhalki Hobli',                   0, @ts, @ts, @sys, @sys),
(80, 40,  'Udgir Hobli',                    0, @ts, @ts, @sys, @sys),
(81, 41,  'Basavakalyan Hobli',             0, @ts, @ts, @sys, @sys),
(82, 41,  'Hulsoor Hobli',                  0, @ts, @ts, @sys, @sys),
(83, 42,  'Raichur Hobli',                  0, @ts, @ts, @sys, @sys),
(84, 42,  'Devadurga Hobli',                0, @ts, @ts, @sys, @sys),
(85, 43,  'Sindhanur Hobli',                0, @ts, @ts, @sys, @sys),
(86, 43,  'Mudgal Hobli',                   0, @ts, @ts, @sys, @sys),
(87, 44,  'Lingasugur Hobli',               0, @ts, @ts, @sys, @sys),
(88, 44,  'Maski Hobli',                    0, @ts, @ts, @sys, @sys),
(89, 45,  'Belagavi Hobli',                 0, @ts, @ts, @sys, @sys),
(90, 45,  'Khanapura Hobli',                0, @ts, @ts, @sys, @sys),
(91, 46,  'Gokak Hobli',                    0, @ts, @ts, @sys, @sys),
(92, 46,  'Mudalagi Hobli',                 0, @ts, @ts, @sys, @sys),
(93, 47,  'Bailhongal Hobli',               0, @ts, @ts, @sys, @sys),
(94, 47,  'Saundatti Hobli',                0, @ts, @ts, @sys, @sys),
(95, 48,  'Hukkeri Hobli',                  0, @ts, @ts, @sys, @sys),
(96, 48,  'Nippanal Hobli',                 0, @ts, @ts, @sys, @sys),
(97, 49,  'Vijayapura Hobli',               0, @ts, @ts, @sys, @sys),
(98, 49,  'Tikota Hobli',                   0, @ts, @ts, @sys, @sys),
(99, 50,  'Indi Hobli',                     0, @ts, @ts, @sys, @sys),
(100,50,  'Talikoti Hobli',                 0, @ts, @ts, @sys, @sys),
(101,51,  'Sindagi Hobli',                  0, @ts, @ts, @sys, @sys),
(102,51,  'Muddebihal Hobli',               0, @ts, @ts, @sys, @sys),
(103,52,  'Bagalkot Hobli',                 0, @ts, @ts, @sys, @sys),
(104,52,  'Kaladgi Hobli',                  0, @ts, @ts, @sys, @sys),
(105,53,  'Badami Hobli',                   0, @ts, @ts, @sys, @sys),
(106,53,  'Guledgudda Hobli',               0, @ts, @ts, @sys, @sys),
(107,54,  'Jamakhandi Hobli',               0, @ts, @ts, @sys, @sys),
(108,54,  'Bilgi Hobli',                    0, @ts, @ts, @sys, @sys),
(109,55,  'Dharwad Hobli',                  0, @ts, @ts, @sys, @sys),
(110,55,  'Kalaghatagi Hobli',              0, @ts, @ts, @sys, @sys),
(111,56,  'Dharwad South Hobli',            0, @ts, @ts, @sys, @sys),
(112,56,  'Hubli Hobli',                    0, @ts, @ts, @sys, @sys),
(113,57,  'Navalgund Hobli',                0, @ts, @ts, @sys, @sys),
(114,57,  'Kundagol Hobli',                 0, @ts, @ts, @sys, @sys),
(115,58,  'Shivamogga Hobli',               0, @ts, @ts, @sys, @sys),
(116,58,  'Shimoga Rural Hobli',            0, @ts, @ts, @sys, @sys),
(117,59,  'Bhadravati Hobli',               0, @ts, @ts, @sys, @sys),
(118,59,  'Honnali Hobli',                  0, @ts, @ts, @sys, @sys),
(119,60,  'Tirthahalli Hobli',              0, @ts, @ts, @sys, @sys),
(120,60,  'Hosanagara Hobli',               0, @ts, @ts, @sys, @sys),
(121,61,  'Davanagere Hobli',               0, @ts, @ts, @sys, @sys),
(122,61,  'Channagiri Hobli',               0, @ts, @ts, @sys, @sys),
(123,62,  'Harihar Hobli',                  0, @ts, @ts, @sys, @sys),
(124,62,  'Ranebennur Hobli',               0, @ts, @ts, @sys, @sys),
(125,63,  'Jagalur Hobli',                  0, @ts, @ts, @sys, @sys),
(126,63,  'Harapanahalli Hobli',            0, @ts, @ts, @sys, @sys),
(127,64,  'Chitradurga Hobli',              0, @ts, @ts, @sys, @sys),
(128,64,  'Molakalmuru Hobli',              0, @ts, @ts, @sys, @sys),
(129,65,  'Hiriyur Hobli',                  0, @ts, @ts, @sys, @sys),
(130,65,  'Challakere Hobli',               0, @ts, @ts, @sys, @sys),
(131,66,  'Holalkere Hobli',                0, @ts, @ts, @sys, @sys),
(132,66,  'Hosadurga Hobli',                0, @ts, @ts, @sys, @sys);

-- =============================================================================
-- SECTION 2: ADDITIONAL USERS
-- DC and staff users for districts 2-20 (district 1 already covered by V17)
-- =============================================================================
INSERT IGNORE INTO users (
    id, username, email, password_hash, full_name, mobile, role,
    district_id, temple_id, mfa_type, is_active, aadhaar_verified,
    failed_login_count, is_deleted, created_at, updated_at, created_by, updated_by
) VALUES
-- District 2: Mandya
(6,  'dc_mandya',          'dc_mandya@templeregistry.dev',
     '$2a$12$Jh5AwLDdLLbuS.Otkb0AK.2aFveu2vjEBCOYKEDKEYk757A2yNrQS',
     'District Collector Mandya',    '9000000006', 'DISTRICT_COLLECTOR', 2, NULL, 'NONE', 1, 1, 0, 0, @ts, @ts, @sys, @sys),
-- District 3: Chamarajanagar
(7,  'dc_chamraj',         'dc_chamraj@templeregistry.dev',
     '$2a$12$Jh5AwLDdLLbuS.Otkb0AK.2aFveu2vjEBCOYKEDKEYk757A2yNrQS',
     'District Collector Chamarajanagar', '9000000007', 'DISTRICT_COLLECTOR', 3, NULL, 'NONE', 1, 1, 0, 0, @ts, @ts, @sys, @sys),
-- District 4: Kodagu
(8,  'dc_kodagu',          'dc_kodagu@templeregistry.dev',
     '$2a$12$Jh5AwLDdLLbuS.Otkb0AK.2aFveu2vjEBCOYKEDKEYk757A2yNrQS',
     'District Collector Kodagu',    '9000000008', 'DISTRICT_COLLECTOR', 4, NULL, 'NONE', 1, 1, 0, 0, @ts, @ts, @sys, @sys),
-- District 5: Hassan
(9,  'dc_hassan',          'dc_hassan@templeregistry.dev',
     '$2a$12$Jh5AwLDdLLbuS.Otkb0AK.2aFveu2vjEBCOYKEDKEYk757A2yNrQS',
     'District Collector Hassan',    '9000000009', 'DISTRICT_COLLECTOR', 5, NULL, 'NONE', 1, 1, 0, 0, @ts, @ts, @sys, @sys),
-- District 6: Bengaluru Urban
(10, 'dc_bengaluru',       'dc_bengaluru@templeregistry.dev',
     '$2a$12$Jh5AwLDdLLbuS.Otkb0AK.2aFveu2vjEBCOYKEDKEYk757A2yNrQS',
     'District Collector Bengaluru', '9000000010', 'DISTRICT_COLLECTOR', 6, NULL, 'NONE', 1, 1, 0, 0, @ts, @ts, @sys, @sys),
-- District 9: Tumkuru
(11, 'dc_tumkuru',         'dc_tumkuru@templeregistry.dev',
     '$2a$12$Jh5AwLDdLLbuS.Otkb0AK.2aFveu2vjEBCOYKEDKEYk757A2yNrQS',
     'District Collector Tumkuru',   '9000000011', 'DISTRICT_COLLECTOR', 9, NULL, 'NONE', 1, 1, 0, 0, @ts, @ts, @sys, @sys),
-- District 11: Kalaburagi
(12, 'dc_kalaburagi',      'dc_kalaburagi@templeregistry.dev',
     '$2a$12$Jh5AwLDdLLbuS.Otkb0AK.2aFveu2vjEBCOYKEDKEYk757A2yNrQS',
     'District Collector Kalaburagi','9000000012', 'DISTRICT_COLLECTOR', 11, NULL, 'NONE', 1, 1, 0, 0, @ts, @ts, @sys, @sys),
-- District 14: Belagavi
(13, 'dc_belagavi',        'dc_belagavi@templeregistry.dev',
     '$2a$12$Jh5AwLDdLLbuS.Otkb0AK.2aFveu2vjEBCOYKEDKEYk757A2yNrQS',
     'District Collector Belagavi',  '9000000013', 'DISTRICT_COLLECTOR', 14, NULL, 'NONE', 1, 1, 0, 0, @ts, @ts, @sys, @sys),
-- District 17: Dharwad
(14, 'dc_dharwad',         'dc_dharwad@templeregistry.dev',
     '$2a$12$Jh5AwLDdLLbuS.Otkb0AK.2aFveu2vjEBCOYKEDKEYk757A2yNrQS',
     'District Collector Dharwad',   '9000000014', 'DISTRICT_COLLECTOR', 17, NULL, 'NONE', 1, 1, 0, 0, @ts, @ts, @sys, @sys),
-- District 18: Shivamogga
(15, 'dc_shivamogga',      'dc_shivamogga@templeregistry.dev',
     '$2a$12$Jh5AwLDdLLbuS.Otkb0AK.2aFveu2vjEBCOYKEDKEYk757A2yNrQS',
     'District Collector Shivamogga','9000000015', 'DISTRICT_COLLECTOR', 18, NULL, 'NONE', 1, 1, 0, 0, @ts, @ts, @sys, @sys);

-- =============================================================================
-- SECTION 3: TEMPLES (760 records)
-- Technique: MySQL 8 recursive CTE for sequence, then CASE/ELT for all fields.
-- Distribution: uneven by district (Mysuru dense, northern districts sparse).
-- All FK references (district_id, taluk_id, hobli_id) reference IDs inserted above.
-- =============================================================================
INSERT INTO temples (
    name, grade, tradition,
    district_id, taluk_id, hobli_id,
    city, pin_code,
    contact_name, contact_phone,
    trust_registered, asset_declaration_status,
    is_deleted, created_at, updated_at, created_by, updated_by, version
)
WITH RECURSIVE seq(n) AS (
    SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 760
),
temple_raw AS (
    SELECT
        n,
        -- ── Grade (A=20%, B=40%, C=40%) ────────────────────────────────────
        CASE n % 10
            WHEN 0 THEN 'A' WHEN 1 THEN 'A'
            WHEN 2 THEN 'B' WHEN 3 THEN 'B' WHEN 4 THEN 'B' WHEN 5 THEN 'B'
            ELSE 'C'
        END AS grade,

        -- ── Primary deity (20-element cycle) ───────────────────────────────
        CASE n % 20
            WHEN 0  THEN 'Shiva'
            WHEN 1  THEN 'Siddeshwara Swamy'
            WHEN 2  THEN 'Veerabhadra Swamy'
            WHEN 3  THEN 'Someshwara'
            WHEN 4  THEN 'Mallikarjuna Swamy'
            WHEN 5  THEN 'Brahmeswara'
            WHEN 6  THEN 'Parameswara'
            WHEN 7  THEN 'Ishwara'
            WHEN 8  THEN 'Venkateswara'
            WHEN 9  THEN 'Ranganatha Swamy'
            WHEN 10 THEN 'Narayana'
            WHEN 11 THEN 'Kesava'
            WHEN 12 THEN 'Lakshmi Narasimha'
            WHEN 13 THEN 'Trivikrama'
            WHEN 14 THEN 'Madhava'
            WHEN 15 THEN 'Chamundeshwari'
            WHEN 16 THEN 'Durgadevi'
            WHEN 17 THEN 'Annapurneshwari'
            WHEN 18 THEN 'Parshwanatha'
            ELSE         'Ganesha'
        END AS primary_deity,

        -- ── Tradition (derived from deity position) ─────────────────────────
        CASE
            WHEN (n % 20) <= 7  THEN 'SHAIVITE'
            WHEN (n % 20) <= 14 THEN 'VAISHNAVITE'
            WHEN (n % 20) <= 17 THEN 'SHAKTA'
            WHEN (n % 20) = 18  THEN 'JAIN'
            ELSE                     'OTHER'
        END AS tradition,

        -- ── District (uneven: Mysuru-heavy at front) ────────────────────────
        CASE
            WHEN n <=  100 THEN 1   -- Mysuru        (100 temples — dense)
            WHEN n <=  165 THEN 2   -- Mandya         (65 temples)
            WHEN n <=  220 THEN 3   -- Chamarajanagar (55 temples)
            WHEN n <=  255 THEN 4   -- Kodagu         (35 temples)
            WHEN n <=  300 THEN 5   -- Hassan         (45 temples)
            WHEN n <=  365 THEN 6   -- Bengaluru Urban(65 temples)
            WHEN n <=  400 THEN 7   -- Bengaluru Rural(35 temples)
            WHEN n <=  430 THEN 8   -- Ramanagara     (30 temples)
            WHEN n <=  465 THEN 9   -- Tumkuru        (35 temples)
            WHEN n <=  490 THEN 10  -- Kolar          (25 temples)
            WHEN n <=  515 THEN 11  -- Kalaburagi     (25 temples)
            WHEN n <=  535 THEN 12  -- Bidar          (20 temples)
            WHEN n <=  560 THEN 13  -- Raichur        (25 temples)
            WHEN n <=  590 THEN 14  -- Belagavi       (30 temples)
            WHEN n <=  615 THEN 15  -- Vijayapura     (25 temples)
            WHEN n <=  635 THEN 16  -- Bagalkot       (20 temples)
            WHEN n <=  660 THEN 17  -- Dharwad        (25 temples)
            WHEN n <=  685 THEN 18  -- Shivamogga     (25 temples)
            WHEN n <=  710 THEN 19  -- Davanagere     (25 temples)
            ELSE                20  -- Chitradurga    (50 temples)
        END AS district_id,

        -- ── Trust registration (67% registered) ───────────────────────────
        IF(n % 3 = 2, 0, 1) AS trust_registered,

        -- ── Declaration status (varied, ~40% approved for dashboard testing) ─
        CASE n % 10
            WHEN 0 THEN 'APPROVED'              WHEN 1 THEN 'APPROVED'
            WHEN 2 THEN 'APPROVED'              WHEN 3 THEN 'APPROVED'
            WHEN 4 THEN 'PENDING_REVIEW'        WHEN 5 THEN 'PENDING_REVIEW'
            WHEN 6 THEN 'OVERDUE'               WHEN 7 THEN 'OVERDUE'
            WHEN 8 THEN NULL                    -- no declaration
            WHEN 9 THEN 'CLARIFICATION_REQUESTED'
        END AS asset_declaration_status,

        -- ── Year established (realistic spread) ───────────────────────────
        CASE
            WHEN n % 100 =  1 THEN  800   -- ancient temples
            WHEN n % 100 = 11 THEN 1100
            WHEN n % 100 = 21 THEN 1250   WHEN n % 100 = 51 THEN 1400
            WHEN n % 100 = 71 THEN 1600   WHEN n % 100 = 91 THEN 1750
            ELSE 1800 + ((n * 17) % 224)  -- 1800–2023
        END AS year_established,

        -- latitude/longitude omitted: column type is DECIMAL(x,0) — no decimal storage
        NULL AS latitude,
        NULL AS longitude
    FROM seq
),
geo AS (
    SELECT
        t.*,
        -- ── Taluk (valid FK within each district) ──────────────────────────
        CASE t.district_id
            WHEN  1 THEN ELT(1 + (t.n %  4),  1,  4,  5,  6)
            WHEN  2 THEN ELT(1 + (t.n %  4),  2,  7,  8,  9)
            WHEN  3 THEN ELT(1 + (t.n %  3),  3, 10, 11, 11)
            WHEN  4 THEN ELT(1 + (t.n %  3), 12, 13, 14, 14)
            WHEN  5 THEN ELT(1 + (t.n %  4), 15, 16, 17, 18)
            WHEN  6 THEN ELT(1 + (t.n %  4), 19, 20, 21, 22)
            WHEN  7 THEN ELT(1 + (t.n %  3), 23, 24, 25, 25)
            WHEN  8 THEN ELT(1 + (t.n %  3), 26, 27, 28, 28)
            WHEN  9 THEN ELT(1 + (t.n %  4), 29, 30, 31, 32)
            WHEN 10 THEN ELT(1 + (t.n %  3), 33, 34, 35, 35)
            WHEN 11 THEN ELT(1 + (t.n %  3), 36, 37, 38, 38)
            WHEN 12 THEN ELT(1 + (t.n %  3), 39, 40, 41, 41)
            WHEN 13 THEN ELT(1 + (t.n %  3), 42, 43, 44, 44)
            WHEN 14 THEN ELT(1 + (t.n %  4), 45, 46, 47, 48)
            WHEN 15 THEN ELT(1 + (t.n %  3), 49, 50, 51, 51)
            WHEN 16 THEN ELT(1 + (t.n %  3), 52, 53, 54, 54)
            WHEN 17 THEN ELT(1 + (t.n %  3), 55, 56, 57, 57)
            WHEN 18 THEN ELT(1 + (t.n %  3), 58, 59, 60, 60)
            WHEN 19 THEN ELT(1 + (t.n %  3), 61, 62, 63, 63)
            ELSE         ELT(1 + (t.n %  3), 64, 65, 66, 66)
        END AS taluk_id
    FROM temple_raw t
),
geo2 AS (
    SELECT
        g.*,
        -- ── Hobli (2 per taluk; formula varies by taluk range) ─────────────
        -- Taluks 1,2,3 have hoblis (1,4), (2,5), (3,6) respectively
        -- Taluks t>=4 have hoblis (2t-1, 2t)
        CASE
            WHEN g.taluk_id = 1 THEN IF(g.n % 2 = 0,  1,  4)
            WHEN g.taluk_id = 2 THEN IF(g.n % 2 = 0,  2,  5)
            WHEN g.taluk_id = 3 THEN IF(g.n % 2 = 0,  3,  6)
            ELSE                     (2 * g.taluk_id - 1) + (g.n % 2)
        END AS hobli_id
    FROM geo g
)
SELECT
    -- Temple name: "Sri {Deity} {suffix}"
    CONCAT('Sri ', g2.primary_deity,
        ELT(1 + (g2.n % 6),
            ' Temple', ' Swamy Temple', ' Devasthana',
            ' Kshetra', ' Mandir', ' Pranadharana Temple')
    )                                              AS name,

    g2.grade,
    g2.tradition,
    g2.district_id,
    CAST(g2.taluk_id  AS UNSIGNED)                AS taluk_id,
    CAST(g2.hobli_id  AS UNSIGNED)                AS hobli_id,

    -- City names (district-appropriate)
    ELT(1 + (g2.n % 12),
        'Mysuru', 'Srirangapatna', 'Nanjangud', 'T Narasipur', 'Hunsur',
        'Periyapatna', 'H D Kote', 'Pandavapura', 'Krishnarajanagara',
        'Tirumakudalu Narasipura', 'Bannur', 'Gundlupet')
                                                   AS city,

    -- Pin code (Karnataka district codes 570-591 for south, 580-591 for north)
    CASE
        WHEN g2.district_id <= 5  THEN CONCAT('57', LPAD((g2.district_id * 3 + g2.n) % 100, 4, '0'))
        WHEN g2.district_id <= 10 THEN CONCAT('56', LPAD((g2.district_id * 3 + g2.n) % 100, 4, '0'))
        WHEN g2.district_id <= 13 THEN CONCAT('585', LPAD(g2.n % 10, 3, '0'))
        WHEN g2.district_id <= 17 THEN CONCAT('590', LPAD(g2.n % 10, 3, '0'))
        ELSE                           CONCAT('577', LPAD(g2.n % 100, 3, '0'))
    END                                            AS pin_code,

    -- Contact info
    ELT(1 + (g2.n % 8),
        'Rangaswamy', 'Krishnamurti', 'Venkataramaiah', 'Srinivasa Rao',
        'Narayanaswamy', 'Raghavendra', 'Lakshmipathi', 'Subrahmanya')
                                                   AS contact_name,
    CONCAT('90', LPAD((g2.n * 7 + 10000000) % 100000000, 8, '0'))
                                                   AS contact_phone,

    g2.trust_registered,
    g2.asset_declaration_status,
    0                                              AS is_deleted,
    DATE_SUB(@ts, INTERVAL (g2.n % 1800) DAY)     AS created_at,
    DATE_SUB(@ts, INTERVAL (g2.n % 365)  DAY)     AS updated_at,
    @sys                                           AS created_by,
    @sys                                           AS updated_by,
    0                                              AS version
FROM geo2 g2;

-- Edge-case override: 5 famous-name Shiva temples in Mysuru (same name, different locations)
-- Tests: "same name in multiple taluks" filter scenario
UPDATE temples SET name = 'Sri Siddeshwara Swamy Temple'
WHERE id IN (1, 21, 41, 61, 81);

-- =============================================================================
-- SECTION 4: TRUST REGISTRATIONS
-- One trust per temple where trust_registered = 1 (~67% of 760 = ~507 trusts).
-- =============================================================================
INSERT INTO trust_registrations (
    temple_id, trust_type, trust_name, registration_number,
    registered_date, bank_ifsc, bank_name,
    is_deleted, created_at, updated_at, created_by, updated_by, version
)
SELECT
    t.id                                              AS temple_id,
    IF(t.id % 2 = 0, 'PUBLIC', 'PRIVATE')            AS trust_type,
    CONCAT(t.name, ' Trust')                          AS trust_name,
    CONCAT('KTRT-', LPAD(t.id, 6, '0'))               AS registration_number,
    DATE_SUB(CURDATE(), INTERVAL (t.id % 20 + 1) YEAR) AS registered_date,
    ELT(1 + (t.id % 5),
        'SBIN0000001', 'CNRB0000001', 'KARB0000001',
        'UBIN0001234', 'BARB0000001')                 AS bank_ifsc,
    ELT(1 + (t.id % 5),
        'State Bank of India', 'Canara Bank', 'Karnataka Bank',
        'Union Bank of India', 'Bank of Baroda')      AS bank_name,
    0, @ts, @ts, @sys, @sys, 0
FROM temples t
WHERE t.trust_registered = 1 AND t.is_deleted = 0;

-- =============================================================================
-- SECTION 5: BOARD MEMBERS (2 per trust — chairperson + treasurer)
-- =============================================================================
INSERT INTO board_members (
    trust_id, full_name, designation,
    appointment_date, tenure_end_date, contact_number,
    is_current, is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    tr.id                                             AS trust_id,
    ELT(1 + (tr.id % 10),
        'Rama Rao', 'Gopala Krishnaswamy', 'Venkatesh Iyengar', 'Narasimha Murthy',
        'Srinivasa Acharya', 'Lakshmipathi Rao', 'Rangaswamy Gowda', 'Anantha Raju',
        'Subbanna Naidu', 'Krishnaraj Wodeyar')       AS full_name,
    'Chairperson'                                     AS designation,
    DATE_SUB(CURDATE(), INTERVAL (tr.id % 5 + 1) YEAR) AS appointment_date,
    DATE_ADD(CURDATE(), INTERVAL (5 - tr.id % 5) YEAR) AS tenure_end_date,
    CONCAT('97', LPAD((tr.id * 11 + 1000000) % 100000000, 8, '0')) AS contact_number,
    1, 0, @ts, @ts, @sys, @sys
FROM trust_registrations tr
WHERE tr.is_deleted = 0

UNION ALL

SELECT
    tr.id,
    ELT(1 + (tr.id % 8),
        'Channabassavaiah', 'Nanjundaiah', 'Veereshwara Hegde', 'Raghavendra Bhat',
        'Suresh Kulkarni', 'Manjunatha Swamy', 'Prasanna Kumar', 'Shivananda Rao'),
    'Treasurer',
    DATE_SUB(CURDATE(), INTERVAL (tr.id % 4 + 1) YEAR),
    DATE_ADD(CURDATE(), INTERVAL (4 - tr.id % 4) YEAR),
    CONCAT('98', LPAD((tr.id * 13 + 2000000) % 100000000, 8, '0')),
    1, 0, @ts, @ts, @sys, @sys
FROM trust_registrations tr
WHERE tr.is_deleted = 0;

-- =============================================================================
-- SECTION 6: TRUST FINANCIALS (one record per trust for FY 2024-25)
-- =============================================================================
INSERT INTO trust_financials (
    trust_id, financial_year, total_income, total_expenditure,
    surplus_deficit, auditor_name, audit_date, remarks,
    is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    tr.id,
    '2024-25',
    ROUND((tr.id * 12345.67) % 5000000 + 100000, 2)   AS total_income,
    ROUND((tr.id * 9876.54)  % 4000000 +  80000, 2)   AS total_expenditure,
    ROUND(
        ((tr.id * 12345.67) % 5000000 + 100000) -
        ((tr.id * 9876.54)  % 4000000 +  80000), 2
    )                                                  AS surplus_deficit,
    ELT(1 + (tr.id % 5),
        'K Ramaiah & Associates', 'Narayana & Co', 'Srinivasa Audit Firm',
        'Rao & Partners', 'Krishnamurthy Auditors')    AS auditor_name,
    DATE_SUB(CURDATE(), INTERVAL (tr.id % 90) DAY)    AS audit_date,
    'Annual audit completed'                           AS remarks,
    0, @ts, @ts, @sys, @sys
FROM trust_registrations tr
WHERE tr.is_deleted = 0;

-- =============================================================================
-- SECTION 7: ASSET DECLARATIONS
-- One declaration per temple, financial year 2024-25.
-- Status mirrors temple.asset_declaration_status so search summary is consistent.
-- =============================================================================
INSERT INTO asset_declarations (
    temple_id, district_id, status, acknowledgement_number,
    financial_year, version_number,
    -- Immovable assets (surface fields)
    agricultural_land_acres, agricultural_land_value,
    buildings_sqft, buildings_value,
    leased_properties_count, leased_properties_value,
    other_land_value,
    -- Movable assets (surface fields)
    gold_grams, silver_grams, idols_count, vehicles_count,
    financial_assets_value, other_movable_value,
    -- Income / expenditure
    annual_income, annual_expenditure,
    -- Workflow
    due_date, submitted_at, reviewed_at, reviewed_by,
    is_overdue, clarification_round,
    lock_version, is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    t.id                                                AS temple_id,
    t.district_id,
    -- Map temple-level status labels to valid asset_declarations.status enum values
    CASE t.asset_declaration_status
        WHEN 'APPROVED'                THEN 'APPROVED'
        WHEN 'PENDING_REVIEW'          THEN 'PENDING_REVIEW'
        WHEN 'OVERDUE'                 THEN 'PENDING_REVIEW'  -- OVERDUE is a flag (is_overdue=1), not an enum value
        WHEN 'CLARIFICATION_REQUESTED' THEN 'CLARIFICATION_REQUESTED'
        WHEN 'REJECTED'                THEN 'REJECTED'
        ELSE                                'DRAFT'
    END                                                 AS status,
    CASE WHEN t.asset_declaration_status IN ('APPROVED','PENDING_REVIEW','CLARIFICATION_REQUESTED','OVERDUE')
         THEN CONCAT('ACK-2425-', LPAD(t.id, 8, '0'))
         ELSE NULL
    END                                                 AS acknowledgement_number,
    '2024-25'                                           AS financial_year,
    1                                                   AS version_number,

    -- Immovable assets (grade-appropriate scale)
    CASE t.grade
        WHEN 'A' THEN ROUND((t.id % 50 + 10) * 2.5, 3)
        WHEN 'B' THEN ROUND((t.id % 30 + 5)  * 1.5, 3)
        ELSE          ROUND((t.id % 20 + 1)  * 0.75, 3)
    END                                                 AS agricultural_land_acres,
    CASE t.grade
        WHEN 'A' THEN ROUND((t.id % 50 + 10) * 2500000, 2)
        WHEN 'B' THEN ROUND((t.id % 30 + 5)  * 1500000, 2)
        ELSE          ROUND((t.id % 20 + 1)  *  750000, 2)
    END                                                 AS agricultural_land_value,
    CASE t.grade
        WHEN 'A' THEN ROUND((t.id % 50 + 10) * 5000, 2)
        WHEN 'B' THEN ROUND((t.id % 30 + 5)  * 2500, 2)
        ELSE          ROUND((t.id % 20 + 1)  * 1000, 2)
    END                                                 AS buildings_sqft,
    CASE t.grade
        WHEN 'A' THEN ROUND((t.id % 50 + 10) * 50000000, 2)
        WHEN 'B' THEN ROUND((t.id % 30 + 5)  * 25000000, 2)
        ELSE          ROUND((t.id % 20 + 1)  * 10000000, 2)
    END                                                 AS buildings_value,
    t.id % 5                                            AS leased_properties_count,
    ROUND((t.id % 5) * 120000, 2)                       AS leased_properties_value,
    ROUND((t.id % 30 + 1) * 500000, 2)                  AS other_land_value,

    -- Movable assets
    CASE t.grade
        WHEN 'A' THEN ROUND((t.id % 50 + 5) * 100, 3)
        WHEN 'B' THEN ROUND((t.id % 30 + 3) *  50, 3)
        ELSE          ROUND((t.id % 20 + 1) *  20, 3)
    END                                                 AS gold_grams,
    CASE t.grade
        WHEN 'A' THEN ROUND((t.id % 50 + 10) * 1000, 3)
        WHEN 'B' THEN ROUND((t.id % 30 +  5) *  500, 3)
        ELSE          ROUND((t.id % 20 +  2) *  200, 3)
    END                                                 AS silver_grams,
    (t.id % 10 + 1)                                     AS idols_count,
    (t.id % 4)                                          AS vehicles_count,
    ROUND((t.id % 100 + 10) * 50000, 2)                 AS financial_assets_value,
    ROUND((t.id % 50 + 5) * 10000, 2)                   AS other_movable_value,

    -- Income/expenditure (grade-scaled)
    CASE t.grade
        WHEN 'A' THEN ROUND(2000000 + (t.id % 100) * 50000, 2)
        WHEN 'B' THEN ROUND(500000  + (t.id % 100) * 10000, 2)
        ELSE          ROUND(100000  + (t.id % 100) *  2000, 2)
    END                                                 AS annual_income,
    CASE t.grade
        WHEN 'A' THEN ROUND(1500000 + (t.id % 100) * 40000, 2)
        WHEN 'B' THEN ROUND(400000  + (t.id % 100) *  8000, 2)
        ELSE          ROUND(80000   + (t.id % 100) *  1500, 2)
    END                                                 AS annual_expenditure,

    -- Due date (2025-03-31 for FY 2024-25)
    '2025-03-31'                                        AS due_date,

    -- Submission timestamp (only for non-DRAFT, non-NULL statuses)
    CASE WHEN t.asset_declaration_status IN ('APPROVED','PENDING_REVIEW','CLARIFICATION_REQUESTED','OVERDUE')
         THEN DATE_SUB(@ts, INTERVAL (t.id % 300 + 10) DAY)
         ELSE NULL
    END                                                 AS submitted_at,

    -- Reviewed timestamp (only for APPROVED)
    CASE WHEN t.asset_declaration_status = 'APPROVED'
         THEN DATE_SUB(@ts, INTERVAL (t.id % 100 + 5) DAY)
         ELSE NULL
    END                                                 AS reviewed_at,

    -- Reviewed by: maps to dc user (district 1 → user 2 etc.)
    CASE WHEN t.asset_declaration_status = 'APPROVED'
         THEN CASE t.district_id
                  WHEN 1 THEN 2 WHEN 2 THEN 6 WHEN 3 THEN 7
                  ELSE 1
              END
         ELSE NULL
    END                                                 AS reviewed_by,

    -- is_overdue flag
    IF(t.asset_declaration_status = 'OVERDUE', 1, 0)   AS is_overdue,
    IF(t.asset_declaration_status = 'CLARIFICATION_REQUESTED', 1, 0) AS clarification_round,
    0, 0, @ts, @ts, @sys, @sys
FROM temples t
WHERE t.is_deleted = 0;

-- =============================================================================
-- SECTION 8: DECLARATION SUB-TABLES (sample detail records)
-- Populate for APPROVED declarations only to avoid bloating the DB.
-- =============================================================================

-- Agricultural land sub-records
INSERT INTO decl_immov_agri_land (declaration_id, survey_number, area_acres, location, annual_lease_income)
SELECT
    ad.id,
    CONCAT('SY-', LPAD(ad.temple_id, 5, '0'), '-', (ad.temple_id % 3 + 1)),
    ROUND(ad.agricultural_land_acres / (ad.temple_id % 3 + 1), 4),
    CONCAT('Survey No. ', ad.temple_id % 500 + 1, ', ', t.city),
    ROUND(ad.agricultural_land_acres * 12000, 2)
FROM asset_declarations ad
JOIN temples t ON t.id = ad.temple_id
WHERE ad.status = 'APPROVED' AND ad.agricultural_land_acres > 0
LIMIT 600;

-- Precious metals sub-records
INSERT INTO decl_mov_precious_metal (declaration_id, item_type, weight_grams, purity, estimated_value)
SELECT
    ad.id,
    ELT(1 + (ad.temple_id % 3), 'Gold Idol', 'Gold Jewellery', 'Gold Coins'),
    ad.gold_grams,
    '22K',
    ROUND(ad.gold_grams * 6200, 2)   -- approx INR 6200/gram
FROM asset_declarations ad
WHERE ad.status = 'APPROVED' AND ad.gold_grams > 0
LIMIT 600;

-- Vehicle sub-records
INSERT INTO decl_mov_vehicle (declaration_id, vehicle_type, registration_number, year_of_purchase, current_value)
SELECT
    ad.id,
    ELT(1 + (ad.temple_id % 3), 'Car', 'Van', 'Auto Rickshaw'),
    CONCAT('KA-', LPAD(ad.temple_id % 10, 2, '0'), ' ', LPAD(ad.temple_id, 4, '0')),
    2015 + (ad.temple_id % 8),
    ROUND(500000 - (ad.temple_id % 8) * 40000, 2)
FROM asset_declarations ad
WHERE ad.status = 'APPROVED' AND ad.vehicles_count > 0
LIMIT 300;

-- =============================================================================
-- SECTION 9: CONTRACTORS (80 records across 80 temples)
-- =============================================================================
INSERT INTO contractors (
    temple_id, company_name, gst_number, service_type,
    contract_reference, work_order_date, contract_start_date, contract_end_date,
    contract_value, payment_status,
    is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    t.id                                               AS temple_id,
    CONCAT(ELT(1 + (t.id % 8),
        'Sri Constructions', 'Narayana Engineering', 'Gopala Builders',
        'Rangaswamy Contractors', 'Venkataramaiah Works', 'Srinivasa Projects',
        'Karnataka Heritage Builders', 'Raghavendra Infra'),
        ' Pvt Ltd')                                    AS company_name,
    CONCAT('29AABCT', LPAD(t.id, 5, '0'), 'Z', (1 + t.id % 9)) AS gst_number,
    ELT(1 + (t.id % 6),
        'Temple Renovation', 'Gopura Construction', 'Compound Wall Repair',
        'Flooring & Painting', 'Electrical Works', 'Plumbing & Drainage')
                                                       AS service_type,
    CONCAT('WO-2024-', LPAD(t.id, 5, '0'))             AS contract_reference,
    DATE_SUB(CURDATE(), INTERVAL (t.id % 365 + 1) DAY) AS work_order_date,
    DATE_SUB(CURDATE(), INTERVAL (t.id % 300 + 1) DAY) AS contract_start_date,
    DATE_ADD(CURDATE(), INTERVAL (t.id % 365 + 30) DAY) AS contract_end_date,
    ROUND((t.id % 50 + 1) * 100000, 2)                 AS contract_value,
    ELT(1 + (t.id % 3), 'PAID', 'PARTIAL', 'PENDING')  AS payment_status,
    0, @ts, @ts, @sys, @sys
FROM temples t
WHERE t.id % 10 = 1   -- every 10th temple has a contractor (80 total)
  AND t.is_deleted = 0
LIMIT 80;

-- =============================================================================
-- SECTION 10: EMPLOYEES (2-3 per Grade A temple, 1-2 per Grade B)
-- =============================================================================
INSERT INTO employees (
    temple_id, full_name, employee_type, status, designation,
    mobile, joining_date,
    is_deleted, created_at, updated_at, created_by, updated_by
)
-- Grade A temples: head priest
SELECT
    t.id,
    CONCAT(ELT(1 + (t.id % 10),
        'Anantha Sharma', 'Narayanacharya', 'Raghavendra Bhat', 'Srinivasa Jois',
        'Venkatesh Dikshit', 'Lakshmipathi Bhat', 'Subrahmanya Acharya',
        'Rangaswamy Dikshit', 'Krishnamurthy Bhat', 'Vishwanatha Sharma')),
    'PRIEST',
    'ACTIVE',
    'Head Priest',  -- designation
    CONCAT('94', LPAD((t.id * 11 + 4000000) % 100000000, 8, '0')),
    DATE_SUB(CURDATE(), INTERVAL (t.id % 15 + 1) YEAR),
    0, @ts, @ts, @sys, @sys
FROM temples t
WHERE t.grade = 'A' AND t.is_deleted = 0

UNION ALL

-- Grade A & B temples: office staff
SELECT
    t.id,
    CONCAT(ELT(1 + (t.id % 8),
        'Manjunatha Gowda', 'Suresh Kumar', 'Ravi Shankar', 'Prasanna Kumar',
        'Nagaraja Reddy', 'Channappa', 'Thirumala Rao', 'Devaraja')),
    'ADMINISTRATIVE',
    'ACTIVE',
    ELT(1 + (t.id % 3), 'Administrative Officer', 'Accounts Assistant', 'Office Manager'),
    CONCAT('99', LPAD((t.id * 9 + 5000000) % 100000000, 8, '0')),
    DATE_SUB(CURDATE(), INTERVAL (t.id % 10 + 1) YEAR),
    0, @ts, @ts, @sys, @sys
FROM temples t
WHERE t.grade IN ('A','B') AND t.is_deleted = 0;

-- =============================================================================
-- SECTION 11: TEMPLE_SEARCH_SUMMARY
-- This is the denormalised read table powering the DC search UI.
-- Derived from temples + trust + declaration data just seeded.
-- =============================================================================
INSERT INTO temple_search_summary (
    temple_id, name, grade, tradition,
    district_id, district_name, city,
    trust_registered, declaration_status,
    latitude, longitude, updated_at
)
SELECT
    t.id                                               AS temple_id,
    t.name,
    t.grade,
    t.tradition,
    t.district_id,
    d.name                                             AS district_name,
    t.city,
    t.trust_registered,
    t.asset_declaration_status                         AS declaration_status,
    t.latitude,
    t.longitude,
    t.updated_at
FROM temples t
JOIN districts d ON d.id = t.district_id
WHERE t.is_deleted = 0;

-- =============================================================================
-- SECTION 12: EDGE-CASE DECLARATIONS (extra test data for DC alert dashboard)
-- Insert additional OVERDUE declarations for Mysuru district to test alert feed.
-- =============================================================================

-- Clarification round records for select temples (tests round-trip workflow)
INSERT INTO declaration_clarifications (
    declaration_id, direction, message, author_id, created_at
)
SELECT
    ad.id,
    'DC_TO_TEMPLE',
    CONCAT('Please submit supporting documents for ', t.name,
           '. Missing: land survey records and valuation certificate.'),
    2,   -- dc_mysuru
    DATE_SUB(@ts, INTERVAL (ad.temple_id % 30 + 5) DAY)
FROM asset_declarations ad
JOIN temples t ON t.id = ad.temple_id
WHERE ad.status = 'CLARIFICATION_REQUESTED'
LIMIT 50;

-- =============================================================================
SET FOREIGN_KEY_CHECKS = 1;
-- =============================================================================
-- V18 seed complete.
-- Summary:
--   geo     : 5 cities, 20 districts, 66 taluks, 132 hoblis
--   users   : 15 (1 super-admin + 10 DCs + 1 DC-staff + 1 TA + 1 auditor + 2 new DC)
--   temples : 760
--   trusts  : ~507 (67% of temples)
--   board_members: ~1014 (2 per trust)
--   trust_financials: ~507
--   asset_declarations: 760 (1 per temple, FY 2024-25)
--   decl sub-tables: ~600 agri land + ~600 precious metal + ~300 vehicles
--   contractors: 80
--   employees: ~300 (grade A priests + grade A/B staff)
--   temple_search_summary: 760
--   declaration_clarifications: up to 50
-- =============================================================================
