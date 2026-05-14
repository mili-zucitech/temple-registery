-- V94: Fix temple_search_summary rows where district_id / taluk_id / hobli_id / city_id
--      are NULL because they were written by the old code that relied exclusively on the
--      JPA Hobli→Taluk→District→City object chain.  Temples auto-created by AdminServiceImpl
--      (e.g. when a TEMPLE_AUTHORITY user is created) only have the flat scalar columns set
--      on the temples table and have no Hobli association, so the chain always resolves to null.
--
-- This migration back-fills those columns from the flat scalars on the temples table,
-- and looks up city_id from the districts table when neither the temple nor the hobli chain has it.
-- Future inserts are handled by the updated TempleSearchSummaryServiceImpl.toSummary() which
-- now falls back to scalar columns and the DistrictRepository when the chain yields null.

-- Step 1: fix rows where district_id is null (these are the problematic auto-created temple rows)
UPDATE temple_search_summary tss
    JOIN temples t ON t.id = tss.temple_id
    LEFT JOIN districts d ON d.id = t.district_id
SET
    tss.district_id = COALESCE(tss.district_id, t.district_id),
    tss.taluk_id    = COALESCE(tss.taluk_id,    t.taluk_id, 0),
    tss.hobli_id    = COALESCE(tss.hobli_id,    t.hobli_id, 0),
    tss.city_id     = COALESCE(tss.city_id,     t.city_id, d.city_id, 0)
WHERE tss.district_id IS NULL
  AND t.is_deleted = false;
