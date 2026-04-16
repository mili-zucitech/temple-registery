-- V24: Rename 'name' to 'full_name' in board_member_staging for consistency
-- --------------------------------------------------------------
-- This migration aligns the staging table with the main table and backend code.

ALTER TABLE board_member_staging
  CHANGE COLUMN name full_name VARCHAR(200) NOT NULL;
