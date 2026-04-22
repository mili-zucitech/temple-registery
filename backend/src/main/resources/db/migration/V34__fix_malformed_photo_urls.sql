-- ============================================================
-- V34: Fix malformed photo URLs in temples table
-- Removes recursive /api/v1/documents/download?key= prefixes
-- and stores only the raw file path
-- ============================================================

-- Fix temples.photo_url - extract the actual file path from malformed URLs
UPDATE temples
SET photo_url = SUBSTRING_INDEX(photo_url, 'key=', -1)
WHERE photo_url LIKE '%/api/v1/documents/download?key=%'
  AND photo_url IS NOT NULL
  AND photo_url != '';

-- Fix temple_photos.file_path if needed
UPDATE temple_photos
SET file_path = SUBSTRING_INDEX(file_path, 'key=', -1)
WHERE file_path LIKE '%/api/v1/documents/download?key=%'
  AND file_path IS NOT NULL
  AND file_path != '';

-- Fix temple_photos.url if it exists and is malformed
UPDATE temple_photos
SET url = SUBSTRING_INDEX(url, 'key=', -1)
WHERE url LIKE '%/api/v1/documents/download?key=%'
  AND url IS NOT NULL
  AND url != '';
