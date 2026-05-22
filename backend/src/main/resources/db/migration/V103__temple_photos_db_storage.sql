-- ============================================================================
-- V103: Store temple photo binary data in the database
--
-- Root cause: photos were only saved to the local ./uploads filesystem.
-- Each developer machine has its own ./uploads folder, so images uploaded on
-- one machine are invisible on another.
--
-- Fix: add image_data (MEDIUMBLOB) and content_type columns to temple_photos.
-- New uploads write bytes to DB; serve endpoints read from DB first (fallback
-- to filesystem path for photos uploaded before this migration).
-- ============================================================================

ALTER TABLE temple_photos
    ADD COLUMN image_data    MEDIUMBLOB   NULL,
    ADD COLUMN content_type  VARCHAR(100) NULL;
