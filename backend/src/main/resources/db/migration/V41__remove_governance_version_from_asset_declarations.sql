-- ============================================================
-- V41: Remove governance_version from asset_declarations
-- This column was incorrectly added to asset_declarations table
-- ============================================================

ALTER TABLE asset_declarations
    DROP COLUMN IF EXISTS governance_version;
