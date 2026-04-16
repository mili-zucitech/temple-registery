-- =============================================================================
-- ASSETS SEED — Asset Declarations + Sub-Tables
-- Standalone script: run AFTER temple_seed.sql
-- Idempotent: ON DUPLICATE KEY / NOT EXISTS guards used selectively.
--
-- Coverage:
--   asset_declarations        : 1 per temple (all 1 020), FY 2024-25
--   decl_immov_agri_land      : APPROVED declarations with agricultural land
--   decl_immov_building       : ALL declarations
--   decl_immov_leased         : temples with leased_properties_count > 0
--   decl_immov_other          : Grade A temples
--   decl_mov_precious_metal   : Gold + Silver items for all APPROVED declarations
--   decl_mov_artifact         : Grade A temples (idols declaration)
--   decl_mov_vehicle          : temples with vehicles_count > 0
--   decl_mov_equipment        : all APPROVED and PENDING_REVIEW declarations
--
-- Status distribution (mirrors temple.asset_declaration_status):
--   APPROVED                  ~40%
--   PENDING_REVIEW            ~20%
--   OVERDUE (stored as PR)    ~20%
--   CLARIFICATION_REQUESTED   ~10%
--   DRAFT (NULL temple field)  ~10%
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET @sys = 1;
SET @ts  = NOW();

-- =============================================================================
-- SECTION 1: ASSET DECLARATIONS (one per temple)
-- =============================================================================
INSERT IGNORE INTO asset_declarations (
    temple_id, district_id, status, acknowledgement_number,
    financial_year, version_number,
    -- Immovable
    agricultural_land_acres, agricultural_land_value,
    buildings_sqft, buildings_value,
    leased_properties_count, leased_properties_value, other_land_value,
    -- Movable
    gold_grams, silver_grams, idols_count, vehicles_count,
    financial_assets_value, other_movable_value,
    -- Income / Expenditure
    annual_income, annual_expenditure,
    -- Workflow
    due_date, submitted_at, reviewed_at, reviewed_by,
    is_overdue, clarification_round,
    lock_version, is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT
    t.id, t.district_id,

    -- Status (map from temple field)
    CASE t.asset_declaration_status
        WHEN 'APPROVED'                THEN 'APPROVED'
        WHEN 'PENDING_REVIEW'          THEN 'PENDING_REVIEW'
        WHEN 'OVERDUE'                 THEN 'PENDING_REVIEW'   -- is_overdue flag handles this
        WHEN 'CLARIFICATION_REQUESTED' THEN 'CLARIFICATION_REQUESTED'
        WHEN 'REJECTED'                THEN 'REJECTED'
        ELSE 'DRAFT'
    END AS status,

    -- Acknowledgement number for submitted declarations
    CASE WHEN t.asset_declaration_status IN ('APPROVED','PENDING_REVIEW','CLARIFICATION_REQUESTED','OVERDUE')
         THEN CONCAT('ACK-2425-', LPAD(t.id, 8, '0'))
         ELSE NULL END                                          AS acknowledgement_number,

    '2024-25'                                                   AS financial_year,
    1                                                           AS version_number,

    -- ── Immovable: Agricultural land ─────────────────────────────────────────
    CASE t.grade
        WHEN 'A' THEN ROUND((t.id % 50 + 10) * 2.500, 3)
        WHEN 'B' THEN ROUND((t.id % 30 +  5) * 1.500, 3)
        ELSE          ROUND((t.id % 20 +  1) * 0.750, 3)
    END AS agricultural_land_acres,
    CASE t.grade
        WHEN 'A' THEN ROUND((t.id % 50 + 10) * 2500000, 2)
        WHEN 'B' THEN ROUND((t.id % 30 +  5) * 1500000, 2)
        ELSE          ROUND((t.id % 20 +  1) *  750000, 2)
    END AS agricultural_land_value,

    -- ── Immovable: Buildings ──────────────────────────────────────────────────
    CASE t.grade
        WHEN 'A' THEN ROUND((t.id % 50 + 10) * 5000,    2)
        WHEN 'B' THEN ROUND((t.id % 30 +  5) * 2500,    2)
        ELSE          ROUND((t.id % 20 +  1) * 1000,    2)
    END AS buildings_sqft,
    CASE t.grade
        WHEN 'A' THEN ROUND((t.id % 50 + 10) * 50000000, 2)
        WHEN 'B' THEN ROUND((t.id % 30 +  5) * 25000000, 2)
        ELSE          ROUND((t.id % 20 +  1) * 10000000, 2)
    END AS buildings_value,

    -- ── Immovable: Leased properties ──────────────────────────────────────────
    t.id % 5                                                    AS leased_properties_count,
    ROUND((t.id % 5) * 120000, 2)                              AS leased_properties_value,
    ROUND((t.id % 30 + 1) * 500000, 2)                        AS other_land_value,

    -- ── Movable: Gold & Silver ───────────────────────────────────────────────
    CASE t.grade
        WHEN 'A' THEN ROUND((t.id % 50 + 5)  * 100,  3)
        WHEN 'B' THEN ROUND((t.id % 30 + 3)  *  50,  3)
        ELSE          ROUND((t.id % 20 + 1)  *  20,  3)
    END AS gold_grams,
    CASE t.grade
        WHEN 'A' THEN ROUND((t.id % 50 + 10) * 1000, 3)
        WHEN 'B' THEN ROUND((t.id % 30 +  5) *  500, 3)
        ELSE          ROUND((t.id % 20 +  2) *  200, 3)
    END AS silver_grams,
    (t.id % 10 + 1)                                            AS idols_count,
    (t.id % 4)                                                 AS vehicles_count,

    ROUND((t.id % 100 + 10) * 50000,  2)                      AS financial_assets_value,
    ROUND((t.id % 50  +  5) * 10000,  2)                      AS other_movable_value,

    -- ── Income / Expenditure ──────────────────────────────────────────────────
    CASE t.grade
        WHEN 'A' THEN ROUND(2000000 + (t.id % 100) * 50000, 2)
        WHEN 'B' THEN ROUND(500000  + (t.id % 100) * 10000, 2)
        ELSE          ROUND(100000  + (t.id % 100) *  2000, 2)
    END AS annual_income,
    CASE t.grade
        WHEN 'A' THEN ROUND(1500000 + (t.id % 100) * 40000, 2)
        WHEN 'B' THEN ROUND(400000  + (t.id % 100) *  8000, 2)
        ELSE          ROUND(80000   + (t.id % 100) *  1500, 2)
    END AS annual_expenditure,

    -- ── Workflow timestamps ───────────────────────────────────────────────────
    '2025-03-31'                                                AS due_date,

    CASE WHEN t.asset_declaration_status IN ('APPROVED','PENDING_REVIEW','CLARIFICATION_REQUESTED','OVERDUE')
         THEN DATE_SUB(@ts, INTERVAL (t.id % 300 + 10) DAY)
         ELSE NULL END                                          AS submitted_at,

    CASE WHEN t.asset_declaration_status = 'APPROVED'
         THEN DATE_SUB(@ts, INTERVAL (t.id % 100 +  5) DAY)
         ELSE NULL END                                          AS reviewed_at,

    CASE WHEN t.asset_declaration_status = 'APPROVED'
         THEN CASE t.district_id
                  WHEN 1 THEN 2 WHEN 2 THEN 6 WHEN 3 THEN 7
                  WHEN 4 THEN 8 WHEN 5 THEN 9 ELSE 1 END
         ELSE NULL END                                          AS reviewed_by,

    IF(t.asset_declaration_status = 'OVERDUE', 1, 0)           AS is_overdue,
    IF(t.asset_declaration_status = 'CLARIFICATION_REQUESTED', 1, 0) AS clarification_round,

    0, 0, @ts, @ts, @sys, @sys
FROM temples t
WHERE t.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM asset_declarations ad
        WHERE ad.temple_id = t.id AND ad.financial_year = '2024-25' AND ad.is_deleted = 0
    );

-- =============================================================================
-- SECTION 2: IMMOVABLE — AGRICULTURAL LAND (approved with >0 acres)
-- =============================================================================
INSERT INTO decl_immov_agri_land (
    declaration_id, survey_number, area_acres, location, encumbrance, annual_lease_income
)
SELECT
    ad.id,
    CONCAT('SY-', LPAD(t.id, 5, '0'), '-', (t.id % 3 + 1)),
    ROUND(ad.agricultural_land_acres / (t.id % 3 + 1), 4)       AS area_acres,
    CONCAT('Survey No. ', t.id % 500 + 1, ', ', COALESCE(t.village_town, 'Karnataka'), ' Hobli') AS location,
    CASE t.id % 3
        WHEN 0 THEN 'Nil'
        WHEN 1 THEN 'Minor mortgage (cleared)'
        ELSE        'Nil'
    END                                                          AS encumbrance,
    ROUND(ad.agricultural_land_acres * 12000, 2)                AS annual_lease_income
FROM asset_declarations ad
JOIN temples t ON t.id = ad.temple_id
WHERE ad.status IN ('APPROVED', 'PENDING_REVIEW')
  AND ad.agricultural_land_acres > 0
  AND ad.is_deleted = 0;

-- =============================================================================
-- SECTION 3: IMMOVABLE — BUILDINGS (all declarations)
-- =============================================================================
INSERT INTO decl_immov_building (
    declaration_id, structure_type, area_sqft, condition_text, valuation
)
-- Main temple structure
SELECT
    ad.id,
    ELT(1 + (t.id % 5),
        'Sanctum Sanctorum (Garbhagriha)',
        'Mandapa (Prayer Hall)',
        'Rajagopura (Main Tower)',
        'Kalyana Mantapa',
        'Dharmasala / Pilgrim Rest House'),
    ROUND(ad.buildings_sqft * 0.6, 2),
    ELT(1 + (t.id % 3), 'Good', 'Fair', 'Needs Minor Repairs'),
    ROUND(ad.buildings_value * 0.7, 2)
FROM asset_declarations ad
JOIN temples t ON t.id = ad.temple_id
WHERE ad.buildings_sqft > 0 AND ad.is_deleted = 0

UNION ALL

-- Secondary structure
SELECT
    ad.id,
    ELT(1 + (t.id % 4),
        'Office & Administrative Block',
        'Kitchen & Prasada Hall',
        'Storage & Treasury Room',
        'Gate House & Entrance Arch'),
    ROUND(ad.buildings_sqft * 0.4, 2),
    ELT(1 + (t.id % 3), 'Good', 'Good', 'Under Renovation'),
    ROUND(ad.buildings_value * 0.3, 2)
FROM asset_declarations ad
JOIN temples t ON t.id = ad.temple_id
WHERE ad.buildings_sqft > 0 AND t.grade IN ('A', 'B') AND ad.is_deleted = 0;

-- =============================================================================
-- SECTION 4: IMMOVABLE — LEASED PROPERTIES
-- =============================================================================
INSERT INTO decl_immov_leased (
    declaration_id, lessee_name, lease_expiry, annual_rent
)
SELECT
    ad.id,
    ELT(1 + (ad.temple_id % 8),
        'Ramaiah Commercial Tenants', 'Krishnaswamy Shops',
        'Venkataramu Agricultural Lessees', 'Narayana Commercial Complex',
        'Gowda Brothers Farm Lease', 'Suresh Enterprises',
        'Srinivasa Stalls', 'Govt Agriculture Dept'),
    DATE_ADD(CURDATE(), INTERVAL (ad.temple_id % 5 + 1) YEAR),
    ROUND(ad.leased_properties_value / ad.leased_properties_count, 2)
FROM asset_declarations ad
WHERE ad.leased_properties_count > 0 AND ad.is_deleted = 0;

-- =============================================================================
-- SECTION 5: IMMOVABLE — OTHER LAND (Grade A temples)
-- =============================================================================
INSERT INTO decl_immov_other (
    declaration_id, description, area, valuation
)
SELECT
    ad.id,
    ELT(1 + (ad.temple_id % 4),
        'Temple pond (pushkarini) and surrounding area',
        'Cremation ground / burial land attached to temple',
        'Disputed land under court stay (suit filed)',
        'Donated land awaiting revenue registration'),
    ROUND(ad.other_land_value / 500000, 4),
    ad.other_land_value
FROM asset_declarations ad
JOIN temples t ON t.id = ad.temple_id
WHERE t.grade = 'A' AND ad.other_land_value > 0 AND ad.is_deleted = 0;

-- =============================================================================
-- SECTION 6: MOVABLE — PRECIOUS METALS (APPROVED declarations)
-- =============================================================================
-- Gold items
INSERT INTO decl_mov_precious_metal (
    declaration_id, item_type, weight_grams, purity, estimated_value
)
SELECT
    ad.id,
    ELT(1 + (ad.temple_id % 5),
        'Gold Idol (Main Deity)',   'Gold Crown (Mukuta)',
        'Gold Kavacham (Armour)',   'Gold Jewellery Set',
        'Gold Coins (Tulabhara)'),
    ROUND(ad.gold_grams * 0.6, 3),
    ELT(1 + (ad.temple_id % 3), '22K', '24K', '18K'),
    ROUND(ad.gold_grams * 0.6 * 6200, 2)
FROM asset_declarations ad
WHERE ad.status = 'APPROVED' AND ad.gold_grams > 0 AND ad.is_deleted = 0

UNION ALL

SELECT
    ad.id,
    ELT(1 + (ad.temple_id % 3), 'Gold Lamp (Deepa)', 'Gold Plate (Thali)', 'Gold Chain'),
    ROUND(ad.gold_grams * 0.4, 3),
    ELT(1 + (ad.temple_id % 2), '22K', '18K'),
    ROUND(ad.gold_grams * 0.4 * 6200, 2)
FROM asset_declarations ad
WHERE ad.status = 'APPROVED' AND ad.gold_grams > 0 AND ad.is_deleted = 0;

-- Silver items
INSERT INTO decl_mov_precious_metal (
    declaration_id, item_type, weight_grams, purity, estimated_value
)
SELECT
    ad.id,
    ELT(1 + (ad.temple_id % 4),
        'Silver Vehicle (Vahana)',
        'Silver Throne (Simhasana)',
        'Silver Rathotsava Chariot Fittings',
        'Silver Utensils & Vessels'),
    ad.silver_grams,
    '999',
    ROUND(ad.silver_grams * 75, 2)
FROM asset_declarations ad
WHERE ad.status = 'APPROVED' AND ad.silver_grams > 0 AND ad.is_deleted = 0;

-- =============================================================================
-- SECTION 7: MOVABLE — ARTIFACTS / IDOLS
-- =============================================================================
INSERT INTO decl_mov_artifact (
    declaration_id, name, description, estimated_value, storage_location
)
SELECT
    ad.id,
    ELT(1 + (ad.temple_id % 6),
        'Utsava Murthy (Processional Idol)',
        'Ancient Inscription Panel (Shasana)',
        'Nandi Bull (Stone/Bronze)',
        'Garuda Stambha (Eagle Pillar)',
        'Lamp Column (Deepa Stambha)',
        'Ancient Trishula'),
    CONCAT(
        ELT(1 + (ad.temple_id % 3), 'Stone', 'Bronze', 'Panchaloha'),
        ' artifact of cultural and religious significance, estimated to be ',
        (100 + ad.temple_id % 900), ' years old.'),
    ROUND((ad.temple_id % 50 + 5) * 100000, 2),
    ELT(1 + (ad.temple_id % 3),
        'Inner Sanctum', 'Trophy Cabinet (locked)', 'Heritage Museum in premises')
FROM asset_declarations ad
JOIN temples t ON t.id = ad.temple_id
WHERE t.grade IN ('A', 'B') AND ad.is_deleted = 0;

-- =============================================================================
-- SECTION 8: MOVABLE — VEHICLES
-- =============================================================================
INSERT INTO decl_mov_vehicle (
    declaration_id, vehicle_type, registration_number, year_of_purchase, current_value
)
SELECT
    ad.id,
    ELT(1 + (ad.temple_id % 5),
        'Car (Innova/Ertiga)', 'Tempo Traveller', 'Auto Rickshaw',
        'Tractor', 'Elephant (Temple Elephant)'),
    CONCAT('KA-', LPAD(ad.temple_id % 10, 2, '0'), ' ', LPAD(ad.temple_id % 9999, 4, '0')),
    2013 + (ad.temple_id % 10),
    CASE ad.temple_id % 5
        WHEN 4 THEN 2500000  -- elephant — high value
        ELSE        ROUND(700000 - (ad.temple_id % 10) * 40000, 2)
    END
FROM asset_declarations ad
WHERE ad.vehicles_count > 0 AND ad.status IN ('APPROVED','PENDING_REVIEW') AND ad.is_deleted = 0;

-- =============================================================================
-- SECTION 9: MOVABLE — EQUIPMENT
-- =============================================================================
INSERT INTO decl_mov_equipment (
    declaration_id, description, quantity, unit_value, total_value
)
SELECT
    ad.id,
    ELT(1 + (ad.temple_id % 8),
        'Generator Set (15 kVA)',       'Public Address System',
        'CCTV Camera System (16 ch)',   'Water Purification Unit (RO)',
        'Solar Power System (5 kW)',    'Air Cooler Bank',
        'Fire Extinguisher Set',        'LED Lighting System'),
    (ad.temple_id % 3 + 1)             AS quantity,
    ROUND((ad.temple_id % 10 + 1) * 25000, 2) AS unit_value,
    ROUND((ad.temple_id % 3 + 1) * (ad.temple_id % 10 + 1) * 25000, 2) AS total_value
FROM asset_declarations ad
WHERE ad.status IN ('APPROVED', 'PENDING_REVIEW') AND ad.is_deleted = 0;

-- =============================================================================
-- SECTION 10: CLARIFICATION MESSAGES (for CLARIFICATION_REQUESTED declarations)
-- =============================================================================
INSERT INTO declaration_clarifications (
    declaration_id, direction, message, author_id, section_name, created_at
)
SELECT
    ad.id,
    'DC_TO_TEMPLE',
    CONCAT('Please submit supporting documents for ', t.name,
           '. Missing: ',
           ELT(1 + (t.id % 5),
               'land survey records and valuation certificate.',
               'auditor-certified income statement for FY 2024-25.',
               'latest property tax receipt and encumbrance certificate.',
               'board resolution authorising the declaration submission.',
               'photograph evidence of gold/silver items.')),
    CASE t.district_id
        WHEN 1 THEN 2  WHEN 2 THEN 6  WHEN 3 THEN 7
        WHEN 4 THEN 8  WHEN 5 THEN 9  ELSE 1 END,
    'DECLARATION',
    DATE_SUB(@ts, INTERVAL (t.id % 30 + 5) DAY)
FROM asset_declarations ad
JOIN temples t ON t.id = ad.temple_id
WHERE ad.status = 'CLARIFICATION_REQUESTED' AND ad.is_deleted = 0;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- Verification:
-- SELECT status, COUNT(*) FROM asset_declarations WHERE is_deleted=0 GROUP BY status;
-- SELECT COUNT(*) FROM decl_immov_agri_land;
-- SELECT COUNT(*) FROM decl_mov_precious_metal;
-- SELECT COUNT(*) FROM decl_mov_vehicle;
-- =============================================================================
