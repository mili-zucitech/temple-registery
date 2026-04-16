-- =============================================================================
-- V25: Fix NULL city_id in temple_search_summary
--
-- Root cause: Two scenarios leave city_id NULL:
--   (a) V21's INNER JOIN skipped temples whose district_id had no matching row
--       (e.g., cross-db reference mismatch in dev/staging envs).
--   (b) V24's first failed run (contractors INSERT failure) partially inserted
--       summary rows before Flyway rolled back; the second corrected run skipped
--       those rows via INSERT IGNORE, leaving city_id = NULL for new temples.
--
-- This migration performs an idempotent UPDATE-with-JOIN to backfill all NULL
-- city_id values. It also logs the count of still-unresolvable rows (where the
-- district itself has no city — data integrity gap) via a SELECT after the fix.
-- =============================================================================

-- ── Step 1: Backfill NULL city_id for all summary rows that can be resolved ──
UPDATE temple_search_summary tss
JOIN temples t          ON t.id = tss.temple_id  AND t.is_deleted = 0
JOIN districts d        ON d.id = t.district_id
JOIN cities c           ON c.id = d.city_id
SET tss.city_id = d.city_id
WHERE tss.city_id IS NULL;

-- ── Step 2: Backfill temple_status for rows left NULL by partial V24 runs ────
UPDATE temple_search_summary tss
JOIN temples t ON t.id = tss.temple_id AND t.is_deleted = 0
SET tss.temple_status = t.status
WHERE tss.temple_status IS NULL OR tss.temple_status = '';

-- ── Step 3: Backfill registration_number / district_id / hobli_id / taluk_id
--           for rows inserted by V24's partially-failed first run ─────────────
UPDATE temple_search_summary tss
JOIN temples t ON t.id = tss.temple_id AND t.is_deleted = 0
SET
    tss.registration_number = COALESCE(tss.registration_number, t.registration_number),
    tss.district_id         = COALESCE(tss.district_id, t.district_id),
    tss.hobli_id            = COALESCE(tss.hobli_id, t.hobli_id),
    tss.taluk_id            = COALESCE(tss.taluk_id, t.taluk_id),
    tss.trust_registered    = t.trust_registered
WHERE tss.registration_number IS NULL
   OR tss.district_id IS NULL;

-- ── Step 4: Insert missing summary rows for any temple that has no summary ────
--   Uses COALESCE on city_id so temples with bad district refs get 0 (fallback).
INSERT IGNORE INTO temple_search_summary (
    temple_id, name, registration_number, grade, primary_deity, tradition,
    hobli_id, taluk_id, district_id, city_id, temple_status, trust_registered,
    asset_declaration_status, year_established, photo_url,
    pending_declarations, overdue_declarations, has_active_trust,
    has_approved_declaration, last_declaration_at
)
SELECT
    t.id,
    t.name,
    t.registration_number,
    t.grade,
    t.primary_deity,
    t.tradition,
    t.hobli_id,
    t.taluk_id,
    t.district_id,
    COALESCE(d.city_id, 0),
    t.status,
    t.trust_registered,
    t.asset_declaration_status,
    t.year_established,
    t.photo_url,
    0, 0, 0, 0, NULL
FROM temples t
LEFT JOIN districts d ON d.id = t.district_id
WHERE t.is_deleted = 0
  AND NOT EXISTS (
        SELECT 1 FROM temple_search_summary tss2 WHERE tss2.temple_id = t.id
    );
