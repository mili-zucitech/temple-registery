-- Quick fix: Remove governance_version column from asset_declarations
-- Run this manually if you can't restart the application right now

USE temple_registry;

-- Check if the column exists
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'temple_registry' 
  AND TABLE_NAME = 'asset_declarations' 
  AND COLUMN_NAME = 'governance_version';

-- Remove the column
ALTER TABLE asset_declarations DROP COLUMN IF EXISTS governance_version;

-- Verify it's gone
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'temple_registry' 
  AND TABLE_NAME = 'asset_declarations' 
  AND COLUMN_NAME = 'governance_version';
