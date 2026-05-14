-- V22: Update trust schema according to new requirements (idempotent rewrite)
-- ────────────────────────────────────────────────────────────────────────

SET @sc := DATABASE();

-- RENAME registration_number → trust_registration_number (if not already done)
SET @has_reg_num := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @sc AND table_name = 'trusts' AND column_name = 'registration_number');
SET @sql := IF(@has_reg_num > 0, 'ALTER TABLE trusts RENAME COLUMN registration_number TO trust_registration_number', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- RENAME registration_date → date_of_registration (if not already done)
SET @has_reg_date := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @sc AND table_name = 'trusts' AND column_name = 'registration_date');
SET @sql := IF(@has_reg_date > 0, 'ALTER TABLE trusts RENAME COLUMN registration_date TO date_of_registration', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- RENAME pan_number → trust_pan_number (if not already done)
SET @has_pan := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @sc AND table_name = 'trusts' AND column_name = 'pan_number');
SET @sql := IF(@has_pan > 0, 'ALTER TABLE trusts RENAME COLUMN pan_number TO trust_pan_number', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- DROP stale columns (only if they exist)
SET @has_addr1 := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @sc AND table_name = 'trusts' AND column_name = 'address_line1');
SET @sql := IF(@has_addr1 > 0, 'ALTER TABLE trusts DROP COLUMN address_line1', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_addr2 := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @sc AND table_name = 'trusts' AND column_name = 'address_line2');
SET @sql := IF(@has_addr2 > 0, 'ALTER TABLE trusts DROP COLUMN address_line2', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_pincode := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @sc AND table_name = 'trusts' AND column_name = 'pincode');
SET @sql := IF(@has_pincode > 0, 'ALTER TABLE trusts DROP COLUMN pincode', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_dis_date := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @sc AND table_name = 'trusts' AND column_name = 'dissolution_date');
SET @sql := IF(@has_dis_date > 0, 'ALTER TABLE trusts DROP COLUMN dissolution_date', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_dis_rsn := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @sc AND table_name = 'trusts' AND column_name = 'dissolution_reason');
SET @sql := IF(@has_dis_rsn > 0, 'ALTER TABLE trusts DROP COLUMN dissolution_reason', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_ver := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @sc AND table_name = 'trusts' AND column_name = 'version');
SET @sql := IF(@has_ver > 0, 'ALTER TABLE trusts DROP COLUMN version', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ADD new columns (only if they don't exist yet)
SET @has_ra := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @sc AND table_name = 'trusts' AND column_name = 'registering_authority');
SET @sql := IF(@has_ra = 0, 'ALTER TABLE trusts ADD COLUMN registering_authority VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_tt := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @sc AND table_name = 'trusts' AND column_name = 'trust_type');
SET @sql := IF(@has_tt = 0, "ALTER TABLE trusts ADD COLUMN trust_type ENUM('PUBLIC','PRIVATE') NULL", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_ban := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @sc AND table_name = 'trusts' AND column_name = 'bank_account_number');
SET @sql := IF(@has_ban = 0, 'ALTER TABLE trusts ADD COLUMN bank_account_number VARCHAR(50) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_bnb := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @sc AND table_name = 'trusts' AND column_name = 'bank_name_and_branch');
SET @sql := IF(@has_bnb = 0, 'ALTER TABLE trusts ADD COLUMN bank_name_and_branch VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_ai := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @sc AND table_name = 'trusts' AND column_name = 'annual_income');
SET @sql := IF(@has_ai = 0, 'ALTER TABLE trusts ADD COLUMN annual_income DECIMAL(15,2) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

