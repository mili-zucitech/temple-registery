-- =============================================================================
-- V22: Add performance indexes for temple search module (QA fix)
--
-- Issues fixed:
--   1. grade filter inside a district requires a compound index to avoid full
--      partition scans on every search.
-- Note: FULLTEXT indexes are not supported in TiDB; LIKE-based search is used.
-- =============================================================================

-- ── Compound index: district_id + grade (most common DC filter combination) ──
CREATE INDEX IF NOT EXISTS idx_tss_district_grade
    ON temple_search_summary (district_id, grade);

-- ── Compound index: district_id + trust_registered ───────────────────────────
CREATE INDEX IF NOT EXISTS idx_tss_district_trust
    ON temple_search_summary (district_id, trust_registered);
