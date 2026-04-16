-- =============================================================================
-- GEO SEED — Karnataka Administrative Hierarchy
-- Standalone script: run AFTER schema migrations, BEFORE temple_seed.sql
-- Idempotent: uses INSERT IGNORE throughout.
-- Hierarchy: State → City (Division) → District → Taluk → Hobli
-- Coverage: 1 state · 5 divisions · 20 districts · 66 taluks · 132 hoblis
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET @sys = 1;

-- =============================================================================
-- STATE
-- =============================================================================
INSERT IGNORE INTO states (id, name, code, is_deleted, created_at, updated_at, created_by, updated_by)
VALUES (1, 'Karnataka', 'KA', 0, NOW(), NOW(), @sys, @sys);

-- =============================================================================
-- CITIES (Revenue Divisions)
-- =============================================================================
INSERT IGNORE INTO cities (id, state_id, name, is_deleted, created_at, updated_at, created_by, updated_by) VALUES
(1, 1, 'Mysuru',      0, NOW(), NOW(), @sys, @sys),
(2, 1, 'Bengaluru',   0, NOW(), NOW(), @sys, @sys),
(3, 1, 'Kalaburagi',  0, NOW(), NOW(), @sys, @sys),
(4, 1, 'Belagavi',    0, NOW(), NOW(), @sys, @sys),
(5, 1, 'Shivamogga',  0, NOW(), NOW(), @sys, @sys);

-- =============================================================================
-- DISTRICTS (20 total across 5 divisions)
-- =============================================================================
INSERT IGNORE INTO districts (id, city_id, name, is_deleted, created_at, updated_at, created_by, updated_by) VALUES
-- Mysuru Division (city_id=1)
(1,  1, 'Mysuru',          0, NOW(), NOW(), @sys, @sys),
(2,  1, 'Mandya',          0, NOW(), NOW(), @sys, @sys),
(3,  1, 'Chamarajanagar',  0, NOW(), NOW(), @sys, @sys),
(4,  1, 'Kodagu',          0, NOW(), NOW(), @sys, @sys),
(5,  1, 'Hassan',          0, NOW(), NOW(), @sys, @sys),
-- Bengaluru Division (city_id=2)
(6,  2, 'Bengaluru Urban', 0, NOW(), NOW(), @sys, @sys),
(7,  2, 'Bengaluru Rural', 0, NOW(), NOW(), @sys, @sys),
(8,  2, 'Ramanagara',      0, NOW(), NOW(), @sys, @sys),
(9,  2, 'Tumkuru',         0, NOW(), NOW(), @sys, @sys),
(10, 2, 'Kolar',           0, NOW(), NOW(), @sys, @sys),
-- Kalaburagi Division (city_id=3)
(11, 3, 'Kalaburagi',      0, NOW(), NOW(), @sys, @sys),
(12, 3, 'Bidar',           0, NOW(), NOW(), @sys, @sys),
(13, 3, 'Raichur',         0, NOW(), NOW(), @sys, @sys),
-- Belagavi Division (city_id=4)
(14, 4, 'Belagavi',        0, NOW(), NOW(), @sys, @sys),
(15, 4, 'Vijayapura',      0, NOW(), NOW(), @sys, @sys),
(16, 4, 'Bagalkot',        0, NOW(), NOW(), @sys, @sys),
(17, 4, 'Dharwad',         0, NOW(), NOW(), @sys, @sys),
-- Shivamogga Division (city_id=5)
(18, 5, 'Shivamogga',      0, NOW(), NOW(), @sys, @sys),
(19, 5, 'Davanagere',      0, NOW(), NOW(), @sys, @sys),
(20, 5, 'Chitradurga',     0, NOW(), NOW(), @sys, @sys);

-- =============================================================================
-- TALUKS (66 total; real Karnataka taluk names)
-- =============================================================================
INSERT IGNORE INTO taluks (id, district_id, name, is_deleted, created_at, updated_at, created_by, updated_by) VALUES
-- District 1: Mysuru (4 taluks)
(1,  1, 'Mysuru',                  0, NOW(), NOW(), @sys, @sys),
(4,  1, 'Hunsur',                  0, NOW(), NOW(), @sys, @sys),
(5,  1, 'Periyapatna',             0, NOW(), NOW(), @sys, @sys),
(6,  1, 'Krishnarajanagara',       0, NOW(), NOW(), @sys, @sys),
-- District 2: Mandya (4 taluks)
(2,  2, 'Mandya',                  0, NOW(), NOW(), @sys, @sys),
(7,  2, 'Nagamangala',             0, NOW(), NOW(), @sys, @sys),
(8,  2, 'Maddur',                  0, NOW(), NOW(), @sys, @sys),
(9,  2, 'Malavalli',               0, NOW(), NOW(), @sys, @sys),
-- District 3: Chamarajanagar (3 taluks)
(3,  3, 'Chamarajanagar',          0, NOW(), NOW(), @sys, @sys),
(10, 3, 'Gundlupet',               0, NOW(), NOW(), @sys, @sys),
(11, 3, 'Yelandur',                0, NOW(), NOW(), @sys, @sys),
-- District 4: Kodagu (3 taluks)
(12, 4, 'Madikeri',                0, NOW(), NOW(), @sys, @sys),
(13, 4, 'Virajpet',                0, NOW(), NOW(), @sys, @sys),
(14, 4, 'Somwarpet',               0, NOW(), NOW(), @sys, @sys),
-- District 5: Hassan (4 taluks)
(15, 5, 'Hassan',                  0, NOW(), NOW(), @sys, @sys),
(16, 5, 'Arsikere',                0, NOW(), NOW(), @sys, @sys),
(17, 5, 'Sakleshpur',              0, NOW(), NOW(), @sys, @sys),
(18, 5, 'Belur',                   0, NOW(), NOW(), @sys, @sys),
-- District 6: Bengaluru Urban (4 taluks)
(19, 6, 'Bengaluru North',         0, NOW(), NOW(), @sys, @sys),
(20, 6, 'Bengaluru South',         0, NOW(), NOW(), @sys, @sys),
(21, 6, 'Bengaluru East',          0, NOW(), NOW(), @sys, @sys),
(22, 6, 'Yelahanka',               0, NOW(), NOW(), @sys, @sys),
-- District 7: Bengaluru Rural (3 taluks)
(23, 7, 'Devanahalli',             0, NOW(), NOW(), @sys, @sys),
(24, 7, 'Doddaballapur',           0, NOW(), NOW(), @sys, @sys),
(25, 7, 'Nelamangala',             0, NOW(), NOW(), @sys, @sys),
-- District 8: Ramanagara (3 taluks)
(26, 8, 'Ramanagara',              0, NOW(), NOW(), @sys, @sys),
(27, 8, 'Channapatna',             0, NOW(), NOW(), @sys, @sys),
(28, 8, 'Kanakapura',              0, NOW(), NOW(), @sys, @sys),
-- District 9: Tumkuru (4 taluks)
(29, 9, 'Tumkuru',                 0, NOW(), NOW(), @sys, @sys),
(30, 9, 'Tiptur',                  0, NOW(), NOW(), @sys, @sys),
(31, 9, 'Sira',                    0, NOW(), NOW(), @sys, @sys),
(32, 9, 'Madhugiri',               0, NOW(), NOW(), @sys, @sys),
-- District 10: Kolar (3 taluks)
(33, 10, 'Kolar',                  0, NOW(), NOW(), @sys, @sys),
(34, 10, 'Mulbagal',               0, NOW(), NOW(), @sys, @sys),
(35, 10, 'Srinivasapur',           0, NOW(), NOW(), @sys, @sys),
-- District 11: Kalaburagi (3 taluks)
(36, 11, 'Kalaburagi',             0, NOW(), NOW(), @sys, @sys),
(37, 11, 'Yadgir',                 0, NOW(), NOW(), @sys, @sys),
(38, 11, 'Sedam',                  0, NOW(), NOW(), @sys, @sys),
-- District 12: Bidar (3 taluks)
(39, 12, 'Bidar',                  0, NOW(), NOW(), @sys, @sys),
(40, 12, 'Bhalki',                 0, NOW(), NOW(), @sys, @sys),
(41, 12, 'Basavakalyan',           0, NOW(), NOW(), @sys, @sys),
-- District 13: Raichur (3 taluks)
(42, 13, 'Raichur',                0, NOW(), NOW(), @sys, @sys),
(43, 13, 'Sindhanur',              0, NOW(), NOW(), @sys, @sys),
(44, 13, 'Lingasugur',             0, NOW(), NOW(), @sys, @sys),
-- District 14: Belagavi (4 taluks)
(45, 14, 'Belagavi',               0, NOW(), NOW(), @sys, @sys),
(46, 14, 'Gokak',                  0, NOW(), NOW(), @sys, @sys),
(47, 14, 'Bailhongal',             0, NOW(), NOW(), @sys, @sys),
(48, 14, 'Hukkeri',                0, NOW(), NOW(), @sys, @sys),
-- District 15: Vijayapura (3 taluks)
(49, 15, 'Vijayapura',             0, NOW(), NOW(), @sys, @sys),
(50, 15, 'Indi',                   0, NOW(), NOW(), @sys, @sys),
(51, 15, 'Sindagi',                0, NOW(), NOW(), @sys, @sys),
-- District 16: Bagalkot (3 taluks)
(52, 16, 'Bagalkot',               0, NOW(), NOW(), @sys, @sys),
(53, 16, 'Badami',                 0, NOW(), NOW(), @sys, @sys),
(54, 16, 'Jamakhandi',             0, NOW(), NOW(), @sys, @sys),
-- District 17: Dharwad (3 taluks)
(55, 17, 'Dharwad',                0, NOW(), NOW(), @sys, @sys),
(56, 17, 'Hubli',                  0, NOW(), NOW(), @sys, @sys),
(57, 17, 'Navalgund',              0, NOW(), NOW(), @sys, @sys),
-- District 18: Shivamogga (3 taluks)
(58, 18, 'Shivamogga',             0, NOW(), NOW(), @sys, @sys),
(59, 18, 'Bhadravati',             0, NOW(), NOW(), @sys, @sys),
(60, 18, 'Tirthahalli',            0, NOW(), NOW(), @sys, @sys),
-- District 19: Davanagere (3 taluks)
(61, 19, 'Davanagere',             0, NOW(), NOW(), @sys, @sys),
(62, 19, 'Harihar',                0, NOW(), NOW(), @sys, @sys),
(63, 19, 'Jagalur',                0, NOW(), NOW(), @sys, @sys),
-- District 20: Chitradurga (3 taluks)
(64, 20, 'Chitradurga',            0, NOW(), NOW(), @sys, @sys),
(65, 20, 'Hiriyur',                0, NOW(), NOW(), @sys, @sys),
(66, 20, 'Holalkere',              0, NOW(), NOW(), @sys, @sys);

-- =============================================================================
-- HOBLIS (132 total; 2 per taluk)
-- Taluks 1, 2, 3: legacy IDs (hoblis 1, 2, 3) + added (4, 5, 6)
-- Taluks 4 onwards: 2 hoblis at IDs (2t-1, 2t)
-- =============================================================================
INSERT IGNORE INTO hoblis (id, taluk_id, name, is_deleted, created_at, updated_at, created_by, updated_by) VALUES
-- Taluk 1: Mysuru
(1,   1,  'Chamundi Hobli',               0, NOW(), NOW(), @sys, @sys),
(4,   1,  'T Narasipur Hobli',            0, NOW(), NOW(), @sys, @sys),
-- Taluk 2: Mandya
(2,   2,  'Mandya Hobli',                 0, NOW(), NOW(), @sys, @sys),
(5,   2,  'Srirangapatna Hobli',          0, NOW(), NOW(), @sys, @sys),
-- Taluk 3: Chamarajanagar
(3,   3,  'Kollegal Hobli',               0, NOW(), NOW(), @sys, @sys),
(6,   3,  'Kollegal North Hobli',         0, NOW(), NOW(), @sys, @sys),
-- Taluk 4: Hunsur
(7,   4,  'Hunsur North Hobli',           0, NOW(), NOW(), @sys, @sys),
(8,   4,  'Hunsur South Hobli',           0, NOW(), NOW(), @sys, @sys),
-- Taluk 5: Periyapatna
(9,   5,  'Periyapatna North Hobli',      0, NOW(), NOW(), @sys, @sys),
(10,  5,  'Periyapatna South Hobli',      0, NOW(), NOW(), @sys, @sys),
-- Taluk 6: Krishnarajanagara
(11,  6,  'Krishnarajanagara Hobli',      0, NOW(), NOW(), @sys, @sys),
(12,  6,  'Varuna Hobli',                 0, NOW(), NOW(), @sys, @sys),
-- Taluk 7: Nagamangala
(13,  7,  'Nagamangala Hobli',            0, NOW(), NOW(), @sys, @sys),
(14,  7,  'Doddagaddavalli Hobli',        0, NOW(), NOW(), @sys, @sys),
-- Taluk 8: Maddur
(15,  8,  'Maddur Hobli',                 0, NOW(), NOW(), @sys, @sys),
(16,  8,  'Kokkare Bellur Hobli',         0, NOW(), NOW(), @sys, @sys),
-- Taluk 9: Malavalli
(17,  9,  'Malavalli Hobli',              0, NOW(), NOW(), @sys, @sys),
(18,  9,  'Kere Hobli',                   0, NOW(), NOW(), @sys, @sys),
-- Taluk 10: Gundlupet
(19, 10,  'Gundlupet Hobli',              0, NOW(), NOW(), @sys, @sys),
(20, 10,  'Hangala Hobli',                0, NOW(), NOW(), @sys, @sys),
-- Taluk 11: Yelandur
(21, 11,  'Yelandur Hobli',               0, NOW(), NOW(), @sys, @sys),
(22, 11,  'Sathegala Hobli',              0, NOW(), NOW(), @sys, @sys),
-- Taluk 12: Madikeri
(23, 12,  'Madikeri Hobli',               0, NOW(), NOW(), @sys, @sys),
(24, 12,  'Napoklu Hobli',                0, NOW(), NOW(), @sys, @sys),
-- Taluk 13: Virajpet
(25, 13,  'Virajpet Hobli',               0, NOW(), NOW(), @sys, @sys),
(26, 13,  'Ponnampet Hobli',              0, NOW(), NOW(), @sys, @sys),
-- Taluk 14: Somwarpet
(27, 14,  'Somwarpet Hobli',              0, NOW(), NOW(), @sys, @sys),
(28, 14,  'Shanthalli Hobli',             0, NOW(), NOW(), @sys, @sys),
-- Taluk 15: Hassan
(29, 15,  'Hassan Hobli',                 0, NOW(), NOW(), @sys, @sys),
(30, 15,  'Arasikere Hobli',              0, NOW(), NOW(), @sys, @sys),
-- Taluk 16: Arsikere
(31, 16,  'Arsikere Hobli',               0, NOW(), NOW(), @sys, @sys),
(32, 16,  'Bukkapatna Hobli',             0, NOW(), NOW(), @sys, @sys),
-- Taluk 17: Sakleshpur
(33, 17,  'Sakleshpur Hobli',             0, NOW(), NOW(), @sys, @sys),
(34, 17,  'Donigal Hobli',                0, NOW(), NOW(), @sys, @sys),
-- Taluk 18: Belur
(35, 18,  'Belur Hobli',                  0, NOW(), NOW(), @sys, @sys),
(36, 18,  'Halebidu Hobli',               0, NOW(), NOW(), @sys, @sys),
-- Taluk 19: Bengaluru North
(37, 19,  'Yelahanka Hobli',              0, NOW(), NOW(), @sys, @sys),
(38, 19,  'Jala Hobli',                   0, NOW(), NOW(), @sys, @sys),
-- Taluk 20: Bengaluru South
(39, 20,  'Krishnarajapuram Hobli',       0, NOW(), NOW(), @sys, @sys),
(40, 20,  'Begur Hobli',                  0, NOW(), NOW(), @sys, @sys),
-- Taluk 21: Bengaluru East
(41, 21,  'Hoodi Hobli',                  0, NOW(), NOW(), @sys, @sys),
(42, 21,  'Varthur Hobli',                0, NOW(), NOW(), @sys, @sys),
-- Taluk 22: Yelahanka
(43, 22,  'Yelahanka South Hobli',        0, NOW(), NOW(), @sys, @sys),
(44, 22,  'Dasarahalli Hobli',            0, NOW(), NOW(), @sys, @sys),
-- Taluk 23: Devanahalli
(45, 23,  'Devanahalli Hobli',            0, NOW(), NOW(), @sys, @sys),
(46, 23,  'Vijayapura Hobli',             0, NOW(), NOW(), @sys, @sys),
-- Taluk 24: Doddaballapur
(47, 24,  'Doddaballapur Hobli',          0, NOW(), NOW(), @sys, @sys),
(48, 24,  'Rajanukunte Hobli',            0, NOW(), NOW(), @sys, @sys),
-- Taluk 25: Nelamangala
(49, 25,  'Nelamangala Hobli',            0, NOW(), NOW(), @sys, @sys),
(50, 25,  'Hesaraghatta Hobli',           0, NOW(), NOW(), @sys, @sys),
-- Taluk 26: Ramanagara
(51, 26,  'Ramanagara Hobli',             0, NOW(), NOW(), @sys, @sys),
(52, 26,  'Bidadi Hobli',                 0, NOW(), NOW(), @sys, @sys),
-- Taluk 27: Channapatna
(53, 27,  'Channapatna Hobli',            0, NOW(), NOW(), @sys, @sys),
(54, 27,  'Maddur South Hobli',           0, NOW(), NOW(), @sys, @sys),
-- Taluk 28: Kanakapura
(55, 28,  'Kanakapura Hobli',             0, NOW(), NOW(), @sys, @sys),
(56, 28,  'Sathanur Hobli',               0, NOW(), NOW(), @sys, @sys),
-- Taluk 29: Tumkuru
(57, 29,  'Tumkuru Hobli',                0, NOW(), NOW(), @sys, @sys),
(58, 29,  'Pavagada Hobli',               0, NOW(), NOW(), @sys, @sys),
-- Taluk 30: Tiptur
(59, 30,  'Tiptur Hobli',                 0, NOW(), NOW(), @sys, @sys),
(60, 30,  'Chikkanayakanahalli Hobli',    0, NOW(), NOW(), @sys, @sys),
-- Taluk 31: Sira
(61, 31,  'Sira Hobli',                   0, NOW(), NOW(), @sys, @sys),
(62, 31,  'Bukkapatna South Hobli',       0, NOW(), NOW(), @sys, @sys),
-- Taluk 32: Madhugiri
(63, 32,  'Madhugiri Hobli',              0, NOW(), NOW(), @sys, @sys),
(64, 32,  'Koratagere Hobli',             0, NOW(), NOW(), @sys, @sys),
-- Taluk 33: Kolar
(65, 33,  'Kolar Hobli',                  0, NOW(), NOW(), @sys, @sys),
(66, 33,  'Oorgaum Hobli',                0, NOW(), NOW(), @sys, @sys),
-- Taluk 34: Mulbagal
(67, 34,  'Mulbagal Hobli',               0, NOW(), NOW(), @sys, @sys),
(68, 34,  'Gudibande Hobli',              0, NOW(), NOW(), @sys, @sys),
-- Taluk 35: Srinivasapur
(69, 35,  'Srinivasapur Hobli',           0, NOW(), NOW(), @sys, @sys),
(70, 35,  'Bangarapet Hobli',             0, NOW(), NOW(), @sys, @sys),
-- Taluk 36: Kalaburagi
(71, 36,  'Kalaburagi Hobli',             0, NOW(), NOW(), @sys, @sys),
(72, 36,  'Afzalpur Hobli',               0, NOW(), NOW(), @sys, @sys),
-- Taluk 37: Yadgir
(73, 37,  'Yadgir Hobli',                 0, NOW(), NOW(), @sys, @sys),
(74, 37,  'Shorapur Hobli',               0, NOW(), NOW(), @sys, @sys),
-- Taluk 38: Sedam
(75, 38,  'Sedam Hobli',                  0, NOW(), NOW(), @sys, @sys),
(76, 38,  'Chittapur Hobli',              0, NOW(), NOW(), @sys, @sys),
-- Taluk 39: Bidar
(77, 39,  'Bidar Hobli',                  0, NOW(), NOW(), @sys, @sys),
(78, 39,  'Humnabad Hobli',               0, NOW(), NOW(), @sys, @sys),
-- Taluk 40: Bhalki
(79, 40,  'Bhalki Hobli',                 0, NOW(), NOW(), @sys, @sys),
(80, 40,  'Udgir Hobli',                  0, NOW(), NOW(), @sys, @sys),
-- Taluk 41: Basavakalyan
(81, 41,  'Basavakalyan Hobli',           0, NOW(), NOW(), @sys, @sys),
(82, 41,  'Hulsoor Hobli',                0, NOW(), NOW(), @sys, @sys),
-- Taluk 42: Raichur
(83, 42,  'Raichur Hobli',                0, NOW(), NOW(), @sys, @sys),
(84, 42,  'Devadurga Hobli',              0, NOW(), NOW(), @sys, @sys),
-- Taluk 43: Sindhanur
(85, 43,  'Sindhanur Hobli',              0, NOW(), NOW(), @sys, @sys),
(86, 43,  'Mudgal Hobli',                 0, NOW(), NOW(), @sys, @sys),
-- Taluk 44: Lingasugur
(87, 44,  'Lingasugur Hobli',             0, NOW(), NOW(), @sys, @sys),
(88, 44,  'Maski Hobli',                  0, NOW(), NOW(), @sys, @sys),
-- Taluk 45: Belagavi
(89, 45,  'Belagavi Hobli',               0, NOW(), NOW(), @sys, @sys),
(90, 45,  'Khanapura Hobli',              0, NOW(), NOW(), @sys, @sys),
-- Taluk 46: Gokak
(91, 46,  'Gokak Hobli',                  0, NOW(), NOW(), @sys, @sys),
(92, 46,  'Mudalagi Hobli',               0, NOW(), NOW(), @sys, @sys),
-- Taluk 47: Bailhongal
(93, 47,  'Bailhongal Hobli',             0, NOW(), NOW(), @sys, @sys),
(94, 47,  'Saundatti Hobli',              0, NOW(), NOW(), @sys, @sys),
-- Taluk 48: Hukkeri
(95, 48,  'Hukkeri Hobli',                0, NOW(), NOW(), @sys, @sys),
(96, 48,  'Nippanal Hobli',               0, NOW(), NOW(), @sys, @sys),
-- Taluk 49: Vijayapura
(97, 49,  'Vijayapura Hobli',             0, NOW(), NOW(), @sys, @sys),
(98, 49,  'Tikota Hobli',                 0, NOW(), NOW(), @sys, @sys),
-- Taluk 50: Indi
(99,  50, 'Indi Hobli',                   0, NOW(), NOW(), @sys, @sys),
(100, 50, 'Talikoti Hobli',               0, NOW(), NOW(), @sys, @sys),
-- Taluk 51: Sindagi
(101, 51, 'Sindagi Hobli',                0, NOW(), NOW(), @sys, @sys),
(102, 51, 'Muddebihal Hobli',             0, NOW(), NOW(), @sys, @sys),
-- Taluk 52: Bagalkot
(103, 52, 'Bagalkot Hobli',               0, NOW(), NOW(), @sys, @sys),
(104, 52, 'Kaladgi Hobli',                0, NOW(), NOW(), @sys, @sys),
-- Taluk 53: Badami
(105, 53, 'Badami Hobli',                 0, NOW(), NOW(), @sys, @sys),
(106, 53, 'Guledgudda Hobli',             0, NOW(), NOW(), @sys, @sys),
-- Taluk 54: Jamakhandi
(107, 54, 'Jamakhandi Hobli',             0, NOW(), NOW(), @sys, @sys),
(108, 54, 'Bilgi Hobli',                  0, NOW(), NOW(), @sys, @sys),
-- Taluk 55: Dharwad
(109, 55, 'Dharwad Hobli',                0, NOW(), NOW(), @sys, @sys),
(110, 55, 'Kalaghatagi Hobli',            0, NOW(), NOW(), @sys, @sys),
-- Taluk 56: Hubli
(111, 56, 'Dharwad South Hobli',          0, NOW(), NOW(), @sys, @sys),
(112, 56, 'Hubli Hobli',                  0, NOW(), NOW(), @sys, @sys),
-- Taluk 57: Navalgund
(113, 57, 'Navalgund Hobli',              0, NOW(), NOW(), @sys, @sys),
(114, 57, 'Kundagol Hobli',               0, NOW(), NOW(), @sys, @sys),
-- Taluk 58: Shivamogga
(115, 58, 'Shivamogga Hobli',             0, NOW(), NOW(), @sys, @sys),
(116, 58, 'Shimoga Rural Hobli',          0, NOW(), NOW(), @sys, @sys),
-- Taluk 59: Bhadravati
(117, 59, 'Bhadravati Hobli',             0, NOW(), NOW(), @sys, @sys),
(118, 59, 'Honnali Hobli',                0, NOW(), NOW(), @sys, @sys),
-- Taluk 60: Tirthahalli
(119, 60, 'Tirthahalli Hobli',            0, NOW(), NOW(), @sys, @sys),
(120, 60, 'Hosanagara Hobli',             0, NOW(), NOW(), @sys, @sys),
-- Taluk 61: Davanagere
(121, 61, 'Davanagere Hobli',             0, NOW(), NOW(), @sys, @sys),
(122, 61, 'Channagiri Hobli',             0, NOW(), NOW(), @sys, @sys),
-- Taluk 62: Harihar
(123, 62, 'Harihar Hobli',                0, NOW(), NOW(), @sys, @sys),
(124, 62, 'Ranebennur Hobli',             0, NOW(), NOW(), @sys, @sys),
-- Taluk 63: Jagalur
(125, 63, 'Jagalur Hobli',                0, NOW(), NOW(), @sys, @sys),
(126, 63, 'Harapanahalli Hobli',          0, NOW(), NOW(), @sys, @sys),
-- Taluk 64: Chitradurga
(127, 64, 'Chitradurga Hobli',            0, NOW(), NOW(), @sys, @sys),
(128, 64, 'Molakalmuru Hobli',            0, NOW(), NOW(), @sys, @sys),
-- Taluk 65: Hiriyur
(129, 65, 'Hiriyur Hobli',                0, NOW(), NOW(), @sys, @sys),
(130, 65, 'Challakere Hobli',             0, NOW(), NOW(), @sys, @sys),
-- Taluk 66: Holalkere
(131, 66, 'Holalkere Hobli',              0, NOW(), NOW(), @sys, @sys),
(132, 66, 'Hosadurga Hobli',              0, NOW(), NOW(), @sys, @sys);

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- Verification counts:
--   states:    1
--   cities:    5
--   districts: 20
--   taluks:    66
--   hoblis:    132
-- =============================================================================
