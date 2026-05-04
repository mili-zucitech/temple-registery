-- V69: Ensure governance_version is removed from trusts table.
-- V62 attempted this with IF EXISTS but TiDB silently retained the column.
-- This migration uses a conditional DROP to be idempotent.

SET @has_col := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'trusts'
      AND COLUMN_NAME  = 'governance_version'
);
SET @sql := IF(
    @has_col > 0,
    'ALTER TABLE trusts DROP COLUMN governance_version',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
