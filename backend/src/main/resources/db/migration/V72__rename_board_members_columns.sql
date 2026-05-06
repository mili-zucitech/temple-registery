-- V72: Rename board_members columns to match entity definitions
-- V21 created board_members with legacy column names; this migration
-- renames them to match the BoardMember entity @Column annotations.

-- Rename `name` -> `full_name` if not already renamed.
-- Guard: if full_name already exists AND name also exists (partial-state DB),
-- just drop the old `name` column instead of renaming — avoids "Duplicate column name".
SET @has_bm_name      := (SELECT COUNT(*) FROM information_schema.columns
                          WHERE table_schema = DATABASE() AND table_name = 'board_members' AND column_name = 'name');
SET @has_bm_full_name := (SELECT COUNT(*) FROM information_schema.columns
                          WHERE table_schema = DATABASE() AND table_name = 'board_members' AND column_name = 'full_name');
SET @s := IF(@has_bm_name > 0 AND @has_bm_full_name = 0,
                'ALTER TABLE board_members RENAME COLUMN `name` TO `full_name`',
             IF(@has_bm_name > 0 AND @has_bm_full_name > 0,
                'ALTER TABLE board_members DROP COLUMN `name`',
                'SELECT 1'));
PREPARE p FROM @s; EXECUTE p; DEALLOCATE PREPARE p;

-- Rename `phone` -> `contact_number` if not already renamed
SET @has_bm_phone           := (SELECT COUNT(*) FROM information_schema.columns
                                WHERE table_schema = DATABASE() AND table_name = 'board_members' AND column_name = 'phone');
SET @has_bm_contact_number  := (SELECT COUNT(*) FROM information_schema.columns
                                WHERE table_schema = DATABASE() AND table_name = 'board_members' AND column_name = 'contact_number');
SET @s := IF(@has_bm_phone > 0 AND @has_bm_contact_number = 0,
                'ALTER TABLE board_members RENAME COLUMN `phone` TO `contact_number`',
             IF(@has_bm_phone > 0 AND @has_bm_contact_number > 0,
                'ALTER TABLE board_members DROP COLUMN `phone`',
                'SELECT 1'));
PREPARE p FROM @s; EXECUTE p; DEALLOCATE PREPARE p;

-- Rename `date_of_joining` -> `appointment_date` if not already renamed
SET @has_bm_doj             := (SELECT COUNT(*) FROM information_schema.columns
                                WHERE table_schema = DATABASE() AND table_name = 'board_members' AND column_name = 'date_of_joining');
SET @has_bm_appt_date       := (SELECT COUNT(*) FROM information_schema.columns
                                WHERE table_schema = DATABASE() AND table_name = 'board_members' AND column_name = 'appointment_date');
SET @s := IF(@has_bm_doj > 0 AND @has_bm_appt_date = 0,
                'ALTER TABLE board_members RENAME COLUMN `date_of_joining` TO `appointment_date`',
             IF(@has_bm_doj > 0 AND @has_bm_appt_date > 0,
                'ALTER TABLE board_members DROP COLUMN `date_of_joining`',
                'SELECT 1'));
PREPARE p FROM @s; EXECUTE p; DEALLOCATE PREPARE p;

-- Rename `cessation_date` -> `tenure_end_date` if not already renamed
SET @has_bm_cess            := (SELECT COUNT(*) FROM information_schema.columns
                                WHERE table_schema = DATABASE() AND table_name = 'board_members' AND column_name = 'cessation_date');
SET @has_bm_tenure_end      := (SELECT COUNT(*) FROM information_schema.columns
                                WHERE table_schema = DATABASE() AND table_name = 'board_members' AND column_name = 'tenure_end_date');
SET @s := IF(@has_bm_cess > 0 AND @has_bm_tenure_end = 0,
                'ALTER TABLE board_members RENAME COLUMN `cessation_date` TO `tenure_end_date`',
             IF(@has_bm_cess > 0 AND @has_bm_tenure_end > 0,
                'ALTER TABLE board_members DROP COLUMN `cessation_date`',
                'SELECT 1'));
PREPARE p FROM @s; EXECUTE p; DEALLOCATE PREPARE p;

-- Drop `email` column if it exists (not in entity)
SET @x := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'board_members' AND column_name = 'email');
SET @s := IF(@x > 0, 'ALTER TABLE board_members DROP COLUMN `email`', 'SELECT 1');
PREPARE p FROM @s; EXECUTE p; DEALLOCATE PREPARE p;

-- Add `address` column if not present
SET @x := (SELECT COUNT(*) FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'board_members' AND column_name = 'address');
SET @s := IF(@x = 0, 'ALTER TABLE board_members ADD COLUMN `address` TEXT NULL', 'SELECT 1');
PREPARE p FROM @s; EXECUTE p; DEALLOCATE PREPARE p;
