-- ============================================================
-- V34: Merged migration (resolves duplicate V34 conflict)
--   1. V34__fix_malformed_photo_urls.sql
--   2. V34__update_trust_type_enum.sql
-- ============================================================

-- ------------------------------------------------------------
-- Part 1: Fix malformed photo URLs in temples table
-- Removes recursive /api/v1/documents/download?key= prefixes
-- and stores only the raw file path
-- ------------------------------------------------------------

UPDATE temples
SET photo_url = SUBSTRING_INDEX(photo_url, 'key=', -1)
WHERE photo_url LIKE '%/api/v1/documents/download?key=%'
  AND photo_url IS NOT NULL
  AND photo_url != '';

-- temple_photos table may not exist in all environments; skip if absent
SET @tbl := (SELECT COUNT(*) FROM information_schema.tables
             WHERE table_schema = DATABASE() AND table_name = 'temple_photos');
SET @s1 := IF(@tbl > 0,
    "UPDATE temple_photos SET file_path = SUBSTRING_INDEX(file_path, 'key=', -1) WHERE file_path LIKE '%/api/v1/documents/download?key=%' AND file_path IS NOT NULL AND file_path != ''",
    'SELECT 1');
PREPARE p FROM @s1; EXECUTE p; DEALLOCATE PREPARE p;

SET @s2 := IF(@tbl > 0,
    "UPDATE temple_photos SET url = SUBSTRING_INDEX(url, 'key=', -1) WHERE url LIKE '%/api/v1/documents/download?key=%' AND url IS NOT NULL AND url != ''",
    'SELECT 1');
PREPARE p FROM @s2; EXECUTE p; DEALLOCATE PREPARE p;

-- ------------------------------------------------------------
-- Part 2: Expand trust_type ENUM to match unified frontend/backend values
-- Old values: PUBLIC, PRIVATE
-- New values: SINGLE_TRUSTEE, MULTI_TRUSTEE, ENDOWMENT, DEVASWOM, OTHER
-- ------------------------------------------------------------

-- First expand ENUM to include both old and new values, then migrate data, then remove old values
-- Step 1: Expand ENUM to include all values (old + new) so no data is lost
ALTER TABLE trusts
    MODIFY COLUMN trust_type ENUM('PUBLIC','PRIVATE','SINGLE_TRUSTEE','MULTI_TRUSTEE','ENDOWMENT','DEVASWOM','OTHER') NULL DEFAULT 'MULTI_TRUSTEE';

-- Step 2: Migrate old values to new
UPDATE trusts SET trust_type = 'MULTI_TRUSTEE' WHERE trust_type = 'PUBLIC';
UPDATE trusts SET trust_type = 'SINGLE_TRUSTEE' WHERE trust_type = 'PRIVATE';

-- Step 3: Now restrict to new values only
ALTER TABLE trusts
    MODIFY COLUMN trust_type ENUM('SINGLE_TRUSTEE','MULTI_TRUSTEE','ENDOWMENT','DEVASWOM','OTHER') NULL DEFAULT 'MULTI_TRUSTEE';
