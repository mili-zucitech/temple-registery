-- ============================================================
-- V51: Domain Model Cleanup
-- Removes redundant boolean columns and parallel state machine fields
-- identified in the backend-domain-model-cleanup bugfix analysis
-- ============================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Part 1: Clean up Temple table
-- Remove redundant DC verification boolean columns
-- verificationStatus enum is the single source of truth
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop composite index before dropping constituent columns
DROP INDEX IF EXISTS idx_temples_dc_verification ON temples;

-- Check and drop is_verified_by_dc column
SET @column_exists_1 = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'temples'
      AND COLUMN_NAME = 'is_verified_by_dc'
);
SET @sql_1 = IF(@column_exists_1 > 0,
    'ALTER TABLE temples DROP COLUMN is_verified_by_dc',
    'SELECT 1'
);
PREPARE stmt_1 FROM @sql_1;
EXECUTE stmt_1;
DEALLOCATE PREPARE stmt_1;

-- Check and drop is_flagged_by_dc column
SET @column_exists_2 = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'temples'
      AND COLUMN_NAME = 'is_flagged_by_dc'
);
SET @sql_2 = IF(@column_exists_2 > 0,
    'ALTER TABLE temples DROP COLUMN is_flagged_by_dc',
    'SELECT 1'
);
PREPARE stmt_2 FROM @sql_2;
EXECUTE stmt_2;
DEALLOCATE PREPARE stmt_2;

-- Check and drop verified_by_dc_at column
SET @column_exists_3 = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'temples'
      AND COLUMN_NAME = 'verified_by_dc_at'
);
SET @sql_3 = IF(@column_exists_3 > 0,
    'ALTER TABLE temples DROP COLUMN verified_by_dc_at',
    'SELECT 1'
);
PREPARE stmt_3 FROM @sql_3;
EXECUTE stmt_3;
DEALLOCATE PREPARE stmt_3;

-- Check and drop verified_by_dc_user_id column
SET @column_exists_4 = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'temples'
      AND COLUMN_NAME = 'verified_by_dc_user_id'
);
SET @sql_4 = IF(@column_exists_4 > 0,
    'ALTER TABLE temples DROP COLUMN verified_by_dc_user_id',
    'SELECT 1'
);
PREPARE stmt_4 FROM @sql_4;
EXECUTE stmt_4;
DEALLOCATE PREPARE stmt_4;

-- Check and drop flagged_by_dc_at column
SET @column_exists_5 = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'temples'
      AND COLUMN_NAME = 'flagged_by_dc_at'
);
SET @sql_5 = IF(@column_exists_5 > 0,
    'ALTER TABLE temples DROP COLUMN flagged_by_dc_at',
    'SELECT 1'
);
PREPARE stmt_5 FROM @sql_5;
EXECUTE stmt_5;
DEALLOCATE PREPARE stmt_5;

-- Check and drop flagged_by_dc_user_id column
SET @column_exists_6 = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'temples'
      AND COLUMN_NAME = 'flagged_by_dc_user_id'
);
SET @sql_6 = IF(@column_exists_6 > 0,
    'ALTER TABLE temples DROP COLUMN flagged_by_dc_user_id',
    'SELECT 1'
);
PREPARE stmt_6 FROM @sql_6;
EXECUTE stmt_6;
DEALLOCATE PREPARE stmt_6;

-- ─────────────────────────────────────────────────────────────────────────────
-- Part 2: Clean up Trust table
-- Remove redundant DC verification boolean column
-- dcDecisionStatus enum is the single source of truth
-- ─────────────────────────────────────────────────────────────────────────────

-- Check and drop is_verified_by_dc column
SET @column_exists_7 = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'trusts'
      AND COLUMN_NAME = 'is_verified_by_dc'
);
SET @sql_7 = IF(@column_exists_7 > 0,
    'ALTER TABLE trusts DROP COLUMN is_verified_by_dc',
    'SELECT 1'
);
PREPARE stmt_7 FROM @sql_7;
EXECUTE stmt_7;
DEALLOCATE PREPARE stmt_7;

-- ─────────────────────────────────────────────────────────────────────────────
-- Part 3: Clean up AssetDeclaration table
-- Remove parallel state machine fields
-- DeclarationStatus (status column) is the single source of truth
-- ─────────────────────────────────────────────────────────────────────────────

-- Check and drop submission_status column
SET @column_exists_8 = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'asset_declarations'
      AND COLUMN_NAME = 'submission_status'
);
SET @sql_8 = IF(@column_exists_8 > 0,
    'ALTER TABLE asset_declarations DROP COLUMN submission_status',
    'SELECT 1'
);
PREPARE stmt_8 FROM @sql_8;
EXECUTE stmt_8;
DEALLOCATE PREPARE stmt_8;

-- Check and drop dc_decision_status column
SET @column_exists_9 = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'asset_declarations'
      AND COLUMN_NAME = 'dc_decision_status'
);
SET @sql_9 = IF(@column_exists_9 > 0,
    'ALTER TABLE asset_declarations DROP COLUMN dc_decision_status',
    'SELECT 1'
);
PREPARE stmt_9 FROM @sql_9;
EXECUTE stmt_9;
DEALLOCATE PREPARE stmt_9;

-- ─────────────────────────────────────────────────────────────────────────────
-- Part 4: Migrate Employee submission_status enum value
-- Change PENDING_REVIEW to SUBMITTED to align with governance.SubmissionStatus
-- ─────────────────────────────────────────────────────────────────────────────

-- Check if submission_status column exists in employees table
SET @column_exists_10 = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'employees'
      AND COLUMN_NAME = 'submission_status'
);

-- Only run the UPDATE if the column exists
SET @sql_10 = IF(@column_exists_10 > 0,
    'UPDATE employees SET submission_status = ''SUBMITTED'' WHERE submission_status = ''PENDING_REVIEW''',
    'SELECT 1'
);
PREPARE stmt_10 FROM @sql_10;
EXECUTE stmt_10;
DEALLOCATE PREPARE stmt_10;
