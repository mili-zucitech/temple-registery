-- =============================================================================
-- V64: Add password reset columns to users (staging-safe and backward compatible)
--
-- Purpose:
--   1) Ensure users.password_reset_token_hash exists
--   2) Ensure users.password_reset_expires_at exists
--   3) Add lookup/cleanup indexes for password reset operations
--   4) Backfill from legacy users.password_reset_token_expires_at if present
--
-- Backward compatibility:
--   - Does not drop legacy columns.
--   - Uses INFORMATION_SCHEMA checks so it is safe on populated databases
--     that may already have some of these fields from prior non-Flyway updates.
--
-- Rollback notes (manual, if ever required):
--   1) DROP INDEX idx_users_password_reset_token_hash ON users;
--   2) DROP INDEX idx_users_password_reset_expires_at ON users;
--   3) ALTER TABLE users DROP COLUMN password_reset_expires_at;
--   4) ALTER TABLE users DROP COLUMN password_reset_token_hash;
--   Keep rollback manual to avoid accidental destructive rollback in shared envs.
-- =============================================================================

SET @schema_name := DATABASE();

-- 1) Add users.password_reset_token_hash when missing
SET @has_token_hash := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'users'
      AND column_name = 'password_reset_token_hash'
);
SET @sql_add_token_hash := IF(
    @has_token_hash = 0,
    'ALTER TABLE users ADD COLUMN password_reset_token_hash VARCHAR(64) NULL COMMENT ''SHA-256 hash of one-time password reset token''',
    'SELECT 1'
);
PREPARE stmt_add_token_hash FROM @sql_add_token_hash;
EXECUTE stmt_add_token_hash;
DEALLOCATE PREPARE stmt_add_token_hash;

-- 2) Add users.password_reset_expires_at when missing
SET @has_reset_expires := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'users'
      AND column_name = 'password_reset_expires_at'
);
SET @sql_add_reset_expires := IF(
    @has_reset_expires = 0,
    'ALTER TABLE users ADD COLUMN password_reset_expires_at DATETIME(6) NULL COMMENT ''Expiry timestamp for one-time password reset token''',
    'SELECT 1'
);
PREPARE stmt_add_reset_expires FROM @sql_add_reset_expires;
EXECUTE stmt_add_reset_expires;
DEALLOCATE PREPARE stmt_add_reset_expires;

-- 3) Backfill from legacy column users.password_reset_token_expires_at, if that column exists
SET @has_legacy_expires := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'users'
      AND column_name = 'password_reset_token_expires_at'
);
SET @sql_backfill_expires := IF(
    @has_legacy_expires > 0,
    'UPDATE users SET password_reset_expires_at = COALESCE(password_reset_expires_at, password_reset_token_expires_at) WHERE password_reset_expires_at IS NULL',
    'SELECT 1'
);
PREPARE stmt_backfill_expires FROM @sql_backfill_expires;
EXECUTE stmt_backfill_expires;
DEALLOCATE PREPARE stmt_backfill_expires;

-- 4) Add index for token-hash lookup, if missing
SET @has_idx_token_hash := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = @schema_name
      AND table_name = 'users'
      AND index_name = 'idx_users_password_reset_token_hash'
);
SET @sql_add_idx_token_hash := IF(
    @has_idx_token_hash = 0,
    'CREATE INDEX idx_users_password_reset_token_hash ON users (password_reset_token_hash)',
    'SELECT 1'
);
PREPARE stmt_add_idx_token_hash FROM @sql_add_idx_token_hash;
EXECUTE stmt_add_idx_token_hash;
DEALLOCATE PREPARE stmt_add_idx_token_hash;

-- 5) Add index for expiry-based cleanup, if missing
SET @has_idx_reset_expires := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = @schema_name
      AND table_name = 'users'
      AND index_name = 'idx_users_password_reset_expires_at'
);
SET @sql_add_idx_reset_expires := IF(
    @has_idx_reset_expires = 0,
    'CREATE INDEX idx_users_password_reset_expires_at ON users (password_reset_expires_at)',
    'SELECT 1'
);
PREPARE stmt_add_idx_reset_expires FROM @sql_add_idx_reset_expires;
EXECUTE stmt_add_idx_reset_expires;
DEALLOCATE PREPARE stmt_add_idx_reset_expires;
