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

UPDATE temple_photos
SET file_path = SUBSTRING_INDEX(file_path, 'key=', -1)
WHERE file_path LIKE '%/api/v1/documents/download?key=%'
  AND file_path IS NOT NULL
  AND file_path != '';

UPDATE temple_photos
SET url = SUBSTRING_INDEX(url, 'key=', -1)
WHERE url LIKE '%/api/v1/documents/download?key=%'
  AND url IS NOT NULL
  AND url != '';

-- ------------------------------------------------------------
-- Part 2: Expand trust_type ENUM to match unified frontend/backend values
-- Old values: PUBLIC, PRIVATE
-- New values: SINGLE_TRUSTEE, MULTI_TRUSTEE, ENDOWMENT, DEVASWOM, OTHER
-- ------------------------------------------------------------

ALTER TABLE trusts
    MODIFY COLUMN trust_type ENUM('SINGLE_TRUSTEE','MULTI_TRUSTEE','ENDOWMENT','DEVASWOM','OTHER') NOT NULL DEFAULT 'MULTI_TRUSTEE';

UPDATE trusts SET trust_type = 'MULTI_TRUSTEE' WHERE trust_type = 'PUBLIC';
UPDATE trusts SET trust_type = 'SINGLE_TRUSTEE' WHERE trust_type = 'PRIVATE';
