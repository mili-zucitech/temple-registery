-- ============================================================
-- V32: Extend temples table with TA profile fields
-- Draft remains in temple_profile_staging; submitted profile is promoted
-- into temples for live/current reads and edits.
-- ============================================================

ALTER TABLE temples
    ADD COLUMN IF NOT EXISTS photo_url VARCHAR(1000) NULL,
    ADD COLUMN IF NOT EXISTS languages_of_worship VARCHAR(500) NULL,
    ADD COLUMN IF NOT EXISTS website VARCHAR(500) NULL,
    ADD COLUMN IF NOT EXISTS linked_institutions JSON NULL,
    ADD COLUMN IF NOT EXISTS annual_festivals TEXT NULL,
    ADD COLUMN IF NOT EXISTS landmark VARCHAR(500) NULL,
    ADD COLUMN IF NOT EXISTS historical_significance TEXT NULL,
    ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR(11) NULL;

