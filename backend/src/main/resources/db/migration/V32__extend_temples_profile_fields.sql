-- ============================================================
-- V32: Extend temples table with TA profile fields
-- Draft remains in temple_profile_staging; submitted profile is promoted
-- into temples for live/current reads and edits.
-- ============================================================

ALTER TABLE temples
    ADD COLUMN website VARCHAR(500) NULL AFTER photo_url,
    ADD COLUMN linked_institutions JSON NULL AFTER languages_of_worship,
    ADD COLUMN annual_festivals TEXT NULL AFTER linked_institutions,
    ADD COLUMN landmark VARCHAR(500) NULL AFTER annual_festivals,
    ADD COLUMN historical_significance TEXT NULL AFTER landmark,
    ADD COLUMN bank_name VARCHAR(100) NULL AFTER historical_significance,
    ADD COLUMN bank_ifsc VARCHAR(11) NULL AFTER bank_name;

