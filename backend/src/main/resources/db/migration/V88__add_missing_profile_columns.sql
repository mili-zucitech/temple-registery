-- =============================================================================
-- V88: Add missing profile content columns to staging, current, and history tables
-- =============================================================================
-- Background: V13 created these three tables with only the original 9 content
-- columns. Subsequent entity evolution added phone, email, website, bank_name,
-- bank_ifsc, description, and version_number without a corresponding migration.
-- In dev/localtest environments Hibernate's ddl-auto:update silently added them;
-- in production/staging (ddl-auto:validate) the missing columns would cause
-- startup failure. This migration makes all environments consistent.
--
-- All ADD COLUMN statements are guarded with IF NOT EXISTS → safe to run on
-- databases that already have the columns (dev/localtest).
-- =============================================================================

-- ─── temple_profile_staging ──────────────────────────────────────────────────

ALTER TABLE temple_profile_staging
    ADD COLUMN IF NOT EXISTS version_number INT NOT NULL DEFAULT 1
        COMMENT 'Business version counter; mirrors workflow_instances.version_number',
    ADD COLUMN IF NOT EXISTS phone        VARCHAR(15)  NULL,
    ADD COLUMN IF NOT EXISTS email        VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS website      VARCHAR(500) NULL,
    ADD COLUMN IF NOT EXISTS bank_name    VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS bank_ifsc    VARCHAR(11)  NULL,
    ADD COLUMN IF NOT EXISTS description  TEXT         NULL;

-- ─── temple_profile_current ──────────────────────────────────────────────────

ALTER TABLE temple_profile_current
    ADD COLUMN IF NOT EXISTS phone        VARCHAR(15)  NULL,
    ADD COLUMN IF NOT EXISTS email        VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS website      VARCHAR(500) NULL,
    ADD COLUMN IF NOT EXISTS bank_name    VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS bank_ifsc    VARCHAR(11)  NULL,
    ADD COLUMN IF NOT EXISTS description  TEXT         NULL;

-- ─── temple_profile_history ──────────────────────────────────────────────────
-- Append-only archive: new columns are nullable so existing rows are unaffected.

ALTER TABLE temple_profile_history
    ADD COLUMN IF NOT EXISTS phone        VARCHAR(15)  NULL,
    ADD COLUMN IF NOT EXISTS email        VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS website      VARCHAR(500) NULL,
    ADD COLUMN IF NOT EXISTS bank_name    VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS bank_ifsc    VARCHAR(11)  NULL,
    ADD COLUMN IF NOT EXISTS description  TEXT         NULL;
