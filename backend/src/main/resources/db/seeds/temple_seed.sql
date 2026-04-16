-- =============================================================================
-- TEMPLE SEED — 1 020 Temple records for Temple Registry DC Module
-- Standalone script: run AFTER geo_seed.sql
-- Idempotent: INSERT IGNORE on registration_number UNIQUE key.
-- Generates 1 020 complete temple records covering all 20 Karnataka districts.
--
-- District distribution (total=1020):
--   Mysuru           130  |  Mandya            90  |  Chamarajanagar 70
--   Kodagu            47  |  Hassan             60  |  Bengaluru Urban 83
--   Bengaluru Rural   46  |  Ramanagara         40  |  Tumkuru         48
--   Kolar             35  |  Kalaburagi          35  |  Bidar           28
--   Raichur           35  |  Belagavi            42  |  Vijayapura      34
--   Bagalkot          28  |  Dharwad             35  |  Shivamogga      35
--   Davanagere        35  |  Chitradurga         64
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET @sys = 1;
SET @ts  = NOW();

-- =============================================================================
-- INSERT 1 020 TEMPLES (n = 1 … 1 020)
-- Technique: recursive CTE → derived tables → INSERT IGNORE
-- =============================================================================
INSERT IGNORE INTO temples (
    registration_number, name, alias_name, grade, primary_deity, tradition,
    year_established, district_id, taluk_id, hobli_id,
    village_town, pin_code, latitude, longitude,
    contact_name, contact_designation, contact_mobile, contact_email,
    trust_registered, asset_declaration_status, status, history,
    is_deleted, created_at, updated_at, created_by, updated_by, version
)
WITH RECURSIVE seq(n) AS (
    SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 1020
),
base AS (
    SELECT
        n,
        CASE n % 10
            WHEN 0 THEN 'A' WHEN 1 THEN 'A'
            WHEN 2 THEN 'B' WHEN 3 THEN 'B' WHEN 4 THEN 'B' WHEN 5 THEN 'B'
            ELSE 'C'
        END AS grade,
        CASE n % 20
            WHEN 0  THEN 'Shiva'              WHEN 1  THEN 'Siddeshwara Swamy'
            WHEN 2  THEN 'Veerabhadra Swamy'  WHEN 3  THEN 'Someshwara'
            WHEN 4  THEN 'Mallikarjuna Swamy' WHEN 5  THEN 'Brahmeswara'
            WHEN 6  THEN 'Parameswara'         WHEN 7  THEN 'Ishwara'
            WHEN 8  THEN 'Venkateswara'        WHEN 9  THEN 'Ranganatha Swamy'
            WHEN 10 THEN 'Narayana'            WHEN 11 THEN 'Kesava'
            WHEN 12 THEN 'Lakshmi Narasimha'  WHEN 13 THEN 'Trivikrama'
            WHEN 14 THEN 'Madhava'             WHEN 15 THEN 'Chamundeshwari'
            WHEN 16 THEN 'Durgadevi'           WHEN 17 THEN 'Annapurneshwari'
            WHEN 18 THEN 'Parshwanatha'
            ELSE 'Ganesha'
        END AS primary_deity,
        CASE
            WHEN (n % 20) <=  7 THEN 'SHAIVITE'
            WHEN (n % 20) <= 14 THEN 'VAISHNAVITE'
            WHEN (n % 20) <= 17 THEN 'SHAKTA'
            WHEN (n % 20) =  18 THEN 'JAIN'
            ELSE 'OTHER'
        END AS tradition,
        -- District (uneven distribution, south Karnataka denser)
        CASE
            WHEN n <=  130 THEN 1   -- Mysuru
            WHEN n <=  220 THEN 2   -- Mandya
            WHEN n <=  290 THEN 3   -- Chamarajanagar
            WHEN n <=  337 THEN 4   -- Kodagu
            WHEN n <=  397 THEN 5   -- Hassan
            WHEN n <=  480 THEN 6   -- Bengaluru Urban
            WHEN n <=  526 THEN 7   -- Bengaluru Rural
            WHEN n <=  566 THEN 8   -- Ramanagara
            WHEN n <=  614 THEN 9   -- Tumkuru
            WHEN n <=  649 THEN 10  -- Kolar
            WHEN n <=  684 THEN 11  -- Kalaburagi
            WHEN n <=  712 THEN 12  -- Bidar
            WHEN n <=  747 THEN 13  -- Raichur
            WHEN n <=  789 THEN 14  -- Belagavi
            WHEN n <=  823 THEN 15  -- Vijayapura
            WHEN n <=  851 THEN 16  -- Bagalkot
            WHEN n <=  886 THEN 17  -- Dharwad
            WHEN n <=  921 THEN 18  -- Shivamogga
            WHEN n <=  956 THEN 19  -- Davanagere
            ELSE                20  -- Chitradurga
        END AS district_id,
        IF(n % 3 = 2, 0, 1)   AS trust_registered,
        CASE n % 10
            WHEN 0 THEN 'APPROVED'                  WHEN 1 THEN 'APPROVED'
            WHEN 2 THEN 'APPROVED'                  WHEN 3 THEN 'APPROVED'
            WHEN 4 THEN 'PENDING_REVIEW'            WHEN 5 THEN 'PENDING_REVIEW'
            WHEN 6 THEN 'OVERDUE'                   WHEN 7 THEN 'OVERDUE'
            WHEN 8 THEN NULL
            WHEN 9 THEN 'CLARIFICATION_REQUESTED'
        END AS asset_declaration_status,
        CASE
            WHEN n % 100 =  1 THEN  800  WHEN n % 100 = 11 THEN 1100
            WHEN n % 100 = 21 THEN 1250  WHEN n % 100 = 51 THEN 1400
            WHEN n % 100 = 71 THEN 1600  WHEN n % 100 = 91 THEN 1750
            ELSE 1800 + ((n * 17) % 224)
        END AS year_established
    FROM seq
),
geo AS (
    SELECT b.*,
        CASE b.district_id
            WHEN  1 THEN ELT(1 + (b.n %  4),  1,  4,  5,  6)
            WHEN  2 THEN ELT(1 + (b.n %  4),  2,  7,  8,  9)
            WHEN  3 THEN ELT(1 + (b.n %  3),  3, 10, 11, 11)
            WHEN  4 THEN ELT(1 + (b.n %  3), 12, 13, 14, 14)
            WHEN  5 THEN ELT(1 + (b.n %  4), 15, 16, 17, 18)
            WHEN  6 THEN ELT(1 + (b.n %  4), 19, 20, 21, 22)
            WHEN  7 THEN ELT(1 + (b.n %  3), 23, 24, 25, 25)
            WHEN  8 THEN ELT(1 + (b.n %  3), 26, 27, 28, 28)
            WHEN  9 THEN ELT(1 + (b.n %  4), 29, 30, 31, 32)
            WHEN 10 THEN ELT(1 + (b.n %  3), 33, 34, 35, 35)
            WHEN 11 THEN ELT(1 + (b.n %  3), 36, 37, 38, 38)
            WHEN 12 THEN ELT(1 + (b.n %  3), 39, 40, 41, 41)
            WHEN 13 THEN ELT(1 + (b.n %  3), 42, 43, 44, 44)
            WHEN 14 THEN ELT(1 + (b.n %  4), 45, 46, 47, 48)
            WHEN 15 THEN ELT(1 + (b.n %  3), 49, 50, 51, 51)
            WHEN 16 THEN ELT(1 + (b.n %  3), 52, 53, 54, 54)
            WHEN 17 THEN ELT(1 + (b.n %  3), 55, 56, 57, 57)
            WHEN 18 THEN ELT(1 + (b.n %  3), 58, 59, 60, 60)
            WHEN 19 THEN ELT(1 + (b.n %  3), 61, 62, 63, 63)
            ELSE         ELT(1 + (b.n %  3), 64, 65, 66, 66)
        END AS taluk_id
    FROM base b
),
geo2 AS (
    SELECT g.*,
        CASE
            WHEN g.taluk_id = 1 THEN IF(g.n % 2 = 0,  1,  4)
            WHEN g.taluk_id = 2 THEN IF(g.n % 2 = 0,  2,  5)
            WHEN g.taluk_id = 3 THEN IF(g.n % 2 = 0,  3,  6)
            ELSE                     (2 * g.taluk_id - 1) + (g.n % 2)
        END AS hobli_id,
        -- Karnataka-accurate coordinates: district centre ± 0.30° variation
        ROUND(CASE g.district_id
            WHEN  1 THEN 12.31 WHEN  2 THEN 12.52 WHEN  3 THEN 11.92
            WHEN  4 THEN 12.42 WHEN  5 THEN 13.00 WHEN  6 THEN 12.97
            WHEN  7 THEN 13.17 WHEN  8 THEN 12.72 WHEN  9 THEN 13.34
            WHEN 10 THEN 13.14 WHEN 11 THEN 17.33 WHEN 12 THEN 17.91
            WHEN 13 THEN 16.21 WHEN 14 THEN 15.85 WHEN 15 THEN 16.83
            WHEN 16 THEN 16.18 WHEN 17 THEN 15.46 WHEN 18 THEN 13.93
            WHEN 19 THEN 14.47 ELSE 14.22
        END + ((g.n * 37 + 11) % 600) / 1000.0 - 0.30, 7) AS latitude,
        ROUND(CASE g.district_id
            WHEN  1 THEN 76.65 WHEN  2 THEN 76.90 WHEN  3 THEN 77.13
            WHEN  4 THEN 75.74 WHEN  5 THEN 76.10 WHEN  6 THEN 77.58
            WHEN  7 THEN 77.32 WHEN  8 THEN 77.28 WHEN  9 THEN 77.10
            WHEN 10 THEN 78.13 WHEN 11 THEN 76.82 WHEN 12 THEN 77.52
            WHEN 13 THEN 77.36 WHEN 14 THEN 74.49 WHEN 15 THEN 75.72
            WHEN 16 THEN 75.70 WHEN 17 THEN 75.01 WHEN 18 THEN 75.57
            WHEN 19 THEN 75.92 ELSE 76.39
        END + ((g.n * 41 + 17) % 600) / 1000.0 - 0.30, 7) AS longitude
    FROM geo g
)
SELECT
    CONCAT('TMP-KA-', LPAD(g2.n, 6, '0')) AS registration_number,

    -- Temple name — deity + location suffix makes each unique
    CONCAT('Sri ', g2.primary_deity, ' ',
        ELT(1 + (g2.n % 12),
            'Chamundi', 'Ranganatha', 'Venkataramana', 'Srinivasa', 'Bhavani',
            'Mallinatha', 'Tirumala', 'Nageshwara', 'Veereshwara', 'Basaveshwara',
            'Subrahmanya', 'Raghavendra'),
        ELT(1 + (g2.n % 6),
            ' Temple', ' Swamy Temple', ' Devasthana', ' Kshetra', ' Mandir', ' Pranadharana Temple')
    ) AS name,

    CASE g2.n % 4
        WHEN 0 THEN CONCAT(g2.primary_deity, ' Mandir')
        WHEN 1 THEN CONCAT(g2.primary_deity, ' Devasthana')
        WHEN 2 THEN NULL
        ELSE        CONCAT('Shri ', g2.primary_deity, ' Temple')
    END AS alias_name,

    g2.grade, g2.primary_deity, g2.tradition, g2.year_established,
    g2.district_id,
    CAST(g2.taluk_id AS UNSIGNED) AS taluk_id,
    CAST(g2.hobli_id AS UNSIGNED) AS hobli_id,

    -- Village/town (district-appropriate)
    CASE g2.district_id
        WHEN  1 THEN ELT(1 + (g2.n %  8), 'Mysuru', 'Srirangapatna', 'Nanjangud', 'Hunsur', 'Periyapatna', 'H D Kote', 'T Narasipur', 'Bannur')
        WHEN  2 THEN ELT(1 + (g2.n %  6), 'Mandya', 'Maddur', 'Nagamangala', 'Pandavapura', 'Malavalli', 'Srirangapatna')
        WHEN  3 THEN ELT(1 + (g2.n %  5), 'Chamarajanagar', 'Kollegala', 'Gundlupet', 'Yelandur', 'Ramapura')
        WHEN  4 THEN ELT(1 + (g2.n %  4), 'Madikeri', 'Virajpet', 'Somwarpet', 'Ponnampet')
        WHEN  5 THEN ELT(1 + (g2.n %  5), 'Hassan', 'Arsikere', 'Sakleshpur', 'Belur', 'Alur')
        WHEN  6 THEN ELT(1 + (g2.n %  6), 'Bengaluru', 'Yelahanka', 'Dasarahalli', 'Mahadevapura', 'Bommanahalli', 'Rajarajeshwarinagar')
        WHEN  7 THEN ELT(1 + (g2.n %  4), 'Devanahalli', 'Doddaballapur', 'Nelamangala', 'Hoskote')
        WHEN  8 THEN ELT(1 + (g2.n %  4), 'Ramanagara', 'Channapatna', 'Kanakapura', 'Bidadi')
        WHEN  9 THEN ELT(1 + (g2.n %  5), 'Tumkuru', 'Tiptur', 'Sira', 'Madhugiri', 'Pavagada')
        WHEN 10 THEN ELT(1 + (g2.n %  4), 'Kolar', 'Bangarpet', 'Mulbagal', 'Srinivasapur')
        WHEN 11 THEN ELT(1 + (g2.n %  4), 'Kalaburagi', 'Yadgir', 'Sedam', 'Afzalpur')
        WHEN 12 THEN ELT(1 + (g2.n %  3), 'Bidar', 'Bhalki', 'Basavakalyan')
        WHEN 13 THEN ELT(1 + (g2.n %  4), 'Raichur', 'Sindhanur', 'Lingasugur', 'Mudgal')
        WHEN 14 THEN ELT(1 + (g2.n %  5), 'Belagavi', 'Gokak', 'Bailhongal', 'Hukkeri', 'Sankeshwar')
        WHEN 15 THEN ELT(1 + (g2.n %  4), 'Vijayapura', 'Indi', 'Sindagi', 'Basavana Bagevadi')
        WHEN 16 THEN ELT(1 + (g2.n %  3), 'Bagalkot', 'Badami', 'Jamakhandi')
        WHEN 17 THEN ELT(1 + (g2.n %  4), 'Dharwad', 'Hubli', 'Navalgund', 'Kalaghatagi')
        WHEN 18 THEN ELT(1 + (g2.n %  4), 'Shivamogga', 'Bhadravati', 'Tirthahalli', 'Sagar')
        WHEN 19 THEN ELT(1 + (g2.n %  4), 'Davanagere', 'Harihar', 'Jagalur', 'Channagiri')
        ELSE         ELT(1 + (g2.n %  4), 'Chitradurga', 'Hiriyur', 'Holalkere', 'Challakere')
    END AS village_town,

    -- Pin code (Karnataka postal district ranges)
    CASE
        WHEN g2.district_id <=  5 THEN CONCAT('57', LPAD((g2.district_id * 3 + g2.n) % 10000, 4, '0'))
        WHEN g2.district_id <= 10 THEN CONCAT('56', LPAD((g2.district_id * 2 + g2.n) % 10000, 4, '0'))
        WHEN g2.district_id <= 13 THEN CONCAT('585', LPAD(g2.n % 1000, 3, '0'))
        WHEN g2.district_id <= 17 THEN CONCAT('590', LPAD(g2.n % 1000, 3, '0'))
        ELSE                           CONCAT('577', LPAD(g2.n % 1000, 3, '0'))
    END AS pin_code,

    g2.latitude,
    g2.longitude,

    -- Contact names (authentic South Indian)
    ELT(1 + (g2.n % 16),
        'Rangaswamy Iyengar', 'Krishnamurti Bhat', 'Venkataramaiah',
        'Srinivasa Rao', 'Narayanaswamy', 'Raghavendra Dikshit',
        'Lakshmipathi Acharya', 'Subrahmanya Bhat',
        'Ananthashayan', 'Manjunatha Gowda', 'Parameshwara Swamy',
        'Nanjundaiah', 'Siddeshwara Naik', 'Channabassappa',
        'Shivaswamy Bhat', 'Venkatanarasimha Rao') AS contact_name,

    ELT(1 + (g2.n % 5),
        'Executive Officer', 'Temple Trustee', 'Head Priest',
        'Manager', 'Honorary Secretary') AS contact_designation,

    CONCAT('90', LPAD((g2.n * 7 + 10000000) % 100000000, 8, '0')) AS contact_mobile,
    CONCAT('temple', g2.n, '@karnataka.gov.in')                     AS contact_email,

    g2.trust_registered,
    g2.asset_declaration_status,

    -- Status: 3 suspended for edge-case testing
    CASE WHEN g2.n IN (50, 150, 250) THEN 'SUSPENDED' ELSE 'ACTIVE' END AS status,

    -- History text (culturally accurate)
    CONCAT(
        'A revered ',
        CASE g2.tradition
            WHEN 'SHAIVITE'   THEN 'Shaivite' WHEN 'VAISHNAVITE' THEN 'Vaishnavite'
            WHEN 'SHAKTA'     THEN 'Shakta'   WHEN 'JAIN'        THEN 'Jain'
            WHEN 'BUDDHIST'   THEN 'Buddhist' ELSE 'ancient'
        END,
        ' temple dedicated to ', g2.primary_deity, ', established around ', g2.year_established,
        '. ',
        ELT(1 + (g2.n % 6),
            'This shrine is renowned for its Dravidian gopura and intricate stone carvings dating to the Hoysala period.',
            'The temple is an important cultural centre for the surrounding hoblis, attracting pilgrims from across Karnataka.',
            'Annual Brahmotsava and Rathotsava festivals draw thousands of devotees from the region.',
            'Managed under the Karnataka Hindu Religious Institutions and Charitable Endowments Act, 1997.',
            'The premises include a kalyana mantapa, dharmasala, and annadana facility for pilgrims.',
            'The temple tank (pushkarini) and surrounding gardens are maintained by the trust board.'
        )
    ) AS history,

    0                                                AS is_deleted,
    DATE_SUB(@ts, INTERVAL (g2.n % 1800) DAY)        AS created_at,
    DATE_SUB(@ts, INTERVAL (g2.n %  365) DAY)        AS updated_at,
    @sys                                             AS created_by,
    @sys                                             AS updated_by,
    0                                                AS version
FROM geo2 g2;

-- Edge-case identical names across taluks (tests search disambiguation)
UPDATE temples SET name = 'Sri Siddeshwara Swamy Temple'
WHERE registration_number IN ('TMP-KA-000001','TMP-KA-000021','TMP-KA-000041','TMP-KA-000061','TMP-KA-000081');

SET FOREIGN_KEY_CHECKS = 1;

-- Verification:
-- SELECT COUNT(*) FROM temples WHERE is_deleted = 0;  -- must be ≥ 1020
-- SELECT district_id, COUNT(*) FROM temples WHERE is_deleted=0 GROUP BY district_id ORDER BY district_id;
