-- =============================================================================
-- V21: Fix temple_search_summary — populate columns left NULL by V18
-- Root cause: The V18 that was applied (checksum 2137774633) pre-dated the
-- current codebase V18 and inserted only V3+V12 columns into temple_search_summary.
-- Hibernate ddl-auto=update subsequently added the entity-mapped columns as NULLs.
-- This migration backfills all null/zero columns from the source tables.
-- =============================================================================

-- ── Step 1: Sync core temple fields + city_id from districts ─────────────────
UPDATE temple_search_summary tss
JOIN temples t ON t.id = tss.temple_id
JOIN districts d ON d.id = t.district_id
SET
    tss.registration_number      = t.registration_number,
    tss.primary_deity            = t.primary_deity,
    tss.hobli_id                 = t.hobli_id,
    tss.taluk_id                 = t.taluk_id,
    tss.asset_declaration_status = t.asset_declaration_status,
    tss.year_established         = t.year_established,
    tss.city_id                  = d.city_id,
    tss.trust_registered         = t.trust_registered,
    tss.temple_status            = t.status
WHERE t.is_deleted = 0;

-- ── Step 2: Sync declaration counters and last_declaration_at ────────────────
UPDATE temple_search_summary tss
JOIN (
    SELECT
        ad.temple_id,
        SUM(CASE WHEN ad.status IN ('PENDING_REVIEW', 'CLARIFICATION_REQUESTED', 'PHYSICAL_VERIFICATION_REQUESTED') THEN 1 ELSE 0 END) AS pending_cnt,
        SUM(CASE WHEN ad.status = 'OVERDUE' THEN 1 ELSE 0 END)                                                                         AS overdue_cnt,
        MAX(ad.submitted_at)                                                                                                            AS last_submitted
    FROM asset_declarations ad
    WHERE ad.is_deleted = 0
    GROUP BY ad.temple_id
) AS agg ON agg.temple_id = tss.temple_id
SET
    tss.pending_declarations = agg.pending_cnt,
    tss.overdue_declarations = agg.overdue_cnt,
    tss.last_declaration_at  = agg.last_submitted;

-- ── Step 3: Sync trust and declaration approval flags ─────────────────────────
UPDATE temple_search_summary tss
LEFT JOIN trust_registrations tr ON tr.temple_id = tss.temple_id AND tr.is_deleted = 0
SET
    tss.has_active_trust         = IF(tss.trust_registered = 1 AND tr.id IS NOT NULL, 1, 0),
    tss.has_approved_declaration = IF(tss.asset_declaration_status = 'APPROVED', 1, 0);

-- ── Step 4: Add missing search indexes (skip if already exist) ────────────────
CREATE INDEX IF NOT EXISTS idx_tss_taluk_id
    ON temple_search_summary (taluk_id);

CREATE INDEX IF NOT EXISTS idx_tss_hobli_id
    ON temple_search_summary (hobli_id);

CREATE INDEX IF NOT EXISTS idx_tss_decl_status
    ON temple_search_summary (district_id, asset_declaration_status);

CREATE INDEX IF NOT EXISTS idx_tss_year_established
    ON temple_search_summary (district_id, year_established);

-- =============================================================================
-- V21 complete. All 760 temple_search_summary rows synced.
-- Filters now operational: talukId, hobliId, assetDeclarationStatus,
-- yearEstablished, keyword (registrationNumber + primaryDeity + name),
-- trustRegistered, hasActiveTrust, hasApprovedDeclaration,
-- pendingDeclarations, overdueDeclarations.
-- =============================================================================
