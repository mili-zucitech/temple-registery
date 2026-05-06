-- =============================================================================
-- V65: Compensating repair for V19..V25 on pre-populated environments
--
-- Purpose:
--   Make schema state idempotent for objects introduced by V19..V25 without
--   editing those historical migrations.
--
-- Notes:
--   - This migration is safe on already-populated databases.
--   - It does not drop legacy columns/tables from prior versions.
-- =============================================================================

SET @schema_name := DATABASE();

-- -----------------------------------------------------------------------------
-- V19 compatibility: users.mfa_phone + mfa_recovery_codes
-- -----------------------------------------------------------------------------
SET @has_users_mfa_phone := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'users'
      AND column_name = 'mfa_phone'
);
SET @sql_add_users_mfa_phone := IF(
    @has_users_mfa_phone = 0,
    'ALTER TABLE users ADD COLUMN mfa_phone VARCHAR(15) NULL COMMENT ''Phone number used for SMS OTP MFA''',
    'SELECT 1'
);
PREPARE stmt_add_users_mfa_phone FROM @sql_add_users_mfa_phone;
EXECUTE stmt_add_users_mfa_phone;
DEALLOCATE PREPARE stmt_add_users_mfa_phone;

CREATE TABLE IF NOT EXISTS mfa_recovery_codes (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    user_id     BIGINT      NOT NULL,
    code_hash   VARCHAR(72) NOT NULL,
    used_at     DATETIME    NULL,
    created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted  TINYINT(1)  NOT NULL DEFAULT 0,
    created_by  BIGINT      NULL,
    updated_by  BIGINT      NULL,
    updated_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_rc_user_available (user_id, used_at),
    CONSTRAINT fk_rc_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @has_idx_rc_user_available := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = @schema_name
      AND table_name = 'mfa_recovery_codes'
      AND index_name = 'idx_rc_user_available'
);
SET @sql_add_idx_rc_user_available := IF(
    @has_idx_rc_user_available = 0,
    'CREATE INDEX idx_rc_user_available ON mfa_recovery_codes (user_id, used_at)',
    'SELECT 1'
);
PREPARE stmt_add_idx_rc_user_available FROM @sql_add_idx_rc_user_available;
EXECUTE stmt_add_idx_rc_user_available;
DEALLOCATE PREPARE stmt_add_idx_rc_user_available;

-- -----------------------------------------------------------------------------
-- V20 compatibility: trust_registrations.date_of_registration
-- NOTE: trust_registrations was dropped in V21 and replaced by 'trusts'.
-- If the table no longer exists, all checks below are safely no-ops.
-- -----------------------------------------------------------------------------
-- Check whether trust_registrations TABLE itself still exists
SET @trust_reg_table_exists := (
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = @schema_name
      AND table_name = 'trust_registrations'
);

-- If table doesn't exist, treat as if the column already exists (no ALTER needed).
SET @has_tr_date_of_registration := IF(
    @trust_reg_table_exists = 0,
    1,
    (SELECT COUNT(*)
     FROM information_schema.columns
     WHERE table_schema = @schema_name
       AND table_name = 'trust_registrations'
       AND column_name = 'date_of_registration')
);
SET @sql_add_tr_date_of_registration := IF(
    @has_tr_table > 0 AND @has_tr_date_of_registration = 0,
    'ALTER TABLE trust_registrations ADD COLUMN date_of_registration DATE NULL',
    'SELECT 1'
);
PREPARE stmt_add_tr_date_of_registration FROM @sql_add_tr_date_of_registration;
EXECUTE stmt_add_tr_date_of_registration;
DEALLOCATE PREPARE stmt_add_tr_date_of_registration;

-- registered_date backfill — also guarded: no-op if table doesn't exist
SET @has_tr_registered_date := IF(
    @trust_reg_table_exists = 0,
    0,
    (SELECT COUNT(*)
     FROM information_schema.columns
     WHERE table_schema = @schema_name
       AND table_name = 'trust_registrations'
       AND column_name = 'registered_date')
);
SET @sql_backfill_tr_date_of_registration := IF(
    @has_tr_table > 0 AND @has_tr_registered_date > 0,
    'UPDATE trust_registrations SET date_of_registration = COALESCE(date_of_registration, registered_date) WHERE date_of_registration IS NULL',
    'SELECT 1'
);
PREPARE stmt_backfill_tr_date_of_registration FROM @sql_backfill_tr_date_of_registration;
EXECUTE stmt_backfill_tr_date_of_registration;
DEALLOCATE PREPARE stmt_backfill_tr_date_of_registration;

-- -----------------------------------------------------------------------------
-- V21/V22/V25 compatibility: trusts table shape and approval columns
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trusts (
    id                       BIGINT       NOT NULL AUTO_INCREMENT,
    temple_id                BIGINT       NOT NULL,
    trust_name               VARCHAR(255) NOT NULL,
    trust_registration_number VARCHAR(100) NULL,
    date_of_registration     DATE         NULL,
    registering_authority    VARCHAR(255) NULL,
    trust_type               VARCHAR(20)  NULL,
    trust_pan_number         VARCHAR(10)  NULL,
    bank_account_number      VARCHAR(50)  NULL,
    bank_name_and_branch     VARCHAR(255) NULL,
    annual_income            DECIMAL(15,2) NULL,
    status                   VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    is_verified_by_dc        TINYINT(1)   NOT NULL DEFAULT 0,
    dc_flag_reason           MEDIUMTEXT   NULL,
    is_deleted               TINYINT(1)   NOT NULL DEFAULT 0,
    created_at               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by               BIGINT       NULL,
    updated_by               BIGINT       NULL,
    PRIMARY KEY (id),
    INDEX idx_trust_temple_id (temple_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @has_trust_registration_number := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = @schema_name AND table_name = 'trusts' AND column_name = 'trust_registration_number'
);
SET @sql_add_trust_registration_number := IF(
    @has_trust_registration_number = 0,
    'ALTER TABLE trusts ADD COLUMN trust_registration_number VARCHAR(100) NULL',
    'SELECT 1'
);
PREPARE stmt_add_trust_registration_number FROM @sql_add_trust_registration_number;
EXECUTE stmt_add_trust_registration_number;
DEALLOCATE PREPARE stmt_add_trust_registration_number;

SET @has_date_of_registration := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = @schema_name AND table_name = 'trusts' AND column_name = 'date_of_registration'
);
SET @sql_add_date_of_registration := IF(
    @has_date_of_registration = 0,
    'ALTER TABLE trusts ADD COLUMN date_of_registration DATE NULL',
    'SELECT 1'
);
PREPARE stmt_add_date_of_registration FROM @sql_add_date_of_registration;
EXECUTE stmt_add_date_of_registration;
DEALLOCATE PREPARE stmt_add_date_of_registration;

SET @has_registering_authority := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = @schema_name AND table_name = 'trusts' AND column_name = 'registering_authority'
);
SET @sql_add_registering_authority := IF(
    @has_registering_authority = 0,
    'ALTER TABLE trusts ADD COLUMN registering_authority VARCHAR(255) NULL',
    'SELECT 1'
);
PREPARE stmt_add_registering_authority FROM @sql_add_registering_authority;
EXECUTE stmt_add_registering_authority;
DEALLOCATE PREPARE stmt_add_registering_authority;

SET @has_trust_type := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = @schema_name AND table_name = 'trusts' AND column_name = 'trust_type'
);
SET @sql_add_trust_type := IF(
    @has_trust_type = 0,
    'ALTER TABLE trusts ADD COLUMN trust_type VARCHAR(20) NULL',
    'SELECT 1'
);
PREPARE stmt_add_trust_type FROM @sql_add_trust_type;
EXECUTE stmt_add_trust_type;
DEALLOCATE PREPARE stmt_add_trust_type;

SET @has_trust_pan_number := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = @schema_name AND table_name = 'trusts' AND column_name = 'trust_pan_number'
);
SET @sql_add_trust_pan_number := IF(
    @has_trust_pan_number = 0,
    'ALTER TABLE trusts ADD COLUMN trust_pan_number VARCHAR(10) NULL',
    'SELECT 1'
);
PREPARE stmt_add_trust_pan_number FROM @sql_add_trust_pan_number;
EXECUTE stmt_add_trust_pan_number;
DEALLOCATE PREPARE stmt_add_trust_pan_number;

SET @has_bank_account_number := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = @schema_name AND table_name = 'trusts' AND column_name = 'bank_account_number'
);
SET @sql_add_bank_account_number := IF(
    @has_bank_account_number = 0,
    'ALTER TABLE trusts ADD COLUMN bank_account_number VARCHAR(50) NULL',
    'SELECT 1'
);
PREPARE stmt_add_bank_account_number FROM @sql_add_bank_account_number;
EXECUTE stmt_add_bank_account_number;
DEALLOCATE PREPARE stmt_add_bank_account_number;

SET @has_bank_name_and_branch := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = @schema_name AND table_name = 'trusts' AND column_name = 'bank_name_and_branch'
);
SET @sql_add_bank_name_and_branch := IF(
    @has_bank_name_and_branch = 0,
    'ALTER TABLE trusts ADD COLUMN bank_name_and_branch VARCHAR(255) NULL',
    'SELECT 1'
);
PREPARE stmt_add_bank_name_and_branch FROM @sql_add_bank_name_and_branch;
EXECUTE stmt_add_bank_name_and_branch;
DEALLOCATE PREPARE stmt_add_bank_name_and_branch;

SET @has_annual_income := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = @schema_name AND table_name = 'trusts' AND column_name = 'annual_income'
);
SET @sql_add_annual_income := IF(
    @has_annual_income = 0,
    'ALTER TABLE trusts ADD COLUMN annual_income DECIMAL(15,2) NULL',
    'SELECT 1'
);
PREPARE stmt_add_annual_income FROM @sql_add_annual_income;
EXECUTE stmt_add_annual_income;
DEALLOCATE PREPARE stmt_add_annual_income;

SET @has_is_verified_by_dc := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = @schema_name AND table_name = 'trusts' AND column_name = 'is_verified_by_dc'
);
SET @sql_add_is_verified_by_dc := IF(
    @has_is_verified_by_dc = 0,
    'ALTER TABLE trusts ADD COLUMN is_verified_by_dc TINYINT(1) NOT NULL DEFAULT 0',
    'SELECT 1'
);
PREPARE stmt_add_is_verified_by_dc FROM @sql_add_is_verified_by_dc;
EXECUTE stmt_add_is_verified_by_dc;
DEALLOCATE PREPARE stmt_add_is_verified_by_dc;

SET @has_dc_flag_reason := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = @schema_name AND table_name = 'trusts' AND column_name = 'dc_flag_reason'
);
SET @sql_add_dc_flag_reason := IF(
    @has_dc_flag_reason = 0,
    'ALTER TABLE trusts ADD COLUMN dc_flag_reason MEDIUMTEXT NULL',
    'SELECT 1'
);
PREPARE stmt_add_dc_flag_reason FROM @sql_add_dc_flag_reason;
EXECUTE stmt_add_dc_flag_reason;
DEALLOCATE PREPARE stmt_add_dc_flag_reason;

-- -----------------------------------------------------------------------------
-- V23/V24 compatibility: board_member_staging and full_name
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS board_member_staging (
    id                   BIGINT       NOT NULL AUTO_INCREMENT,
    trust_id             BIGINT       NOT NULL,
    full_name            VARCHAR(200) NOT NULL,
    aadhaar_encrypted    TEXT         NULL,
    designation          VARCHAR(150) NOT NULL,
    appointment_date     DATE         NOT NULL,
    tenure_end_date      DATE         NULL,
    contact_number       VARCHAR(15)  NULL,
    address              TEXT         NULL,
    status               VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    is_deleted           TINYINT(1)   NOT NULL DEFAULT 0,
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by           BIGINT       NULL,
    updated_by           BIGINT       NULL,
    PRIMARY KEY (id),
    INDEX idx_bms_trust_id (trust_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @has_bms_full_name := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'board_member_staging'
      AND column_name = 'full_name'
);
SET @has_bms_name := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'board_member_staging'
      AND column_name = 'name'
);
SET @sql_bms_name_to_full_name := IF(
    @has_bms_full_name = 0 AND @has_bms_name > 0,
    'ALTER TABLE board_member_staging CHANGE COLUMN name full_name VARCHAR(200) NOT NULL',
    'SELECT 1'
);
PREPARE stmt_bms_name_to_full_name FROM @sql_bms_name_to_full_name;
EXECUTE stmt_bms_name_to_full_name;
DEALLOCATE PREPARE stmt_bms_name_to_full_name;

SET @has_idx_bms_trust_id := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = @schema_name
      AND table_name = 'board_member_staging'
      AND index_name = 'idx_bms_trust_id'
);
SET @sql_add_idx_bms_trust_id := IF(
    @has_idx_bms_trust_id = 0,
    'CREATE INDEX idx_bms_trust_id ON board_member_staging (trust_id)',
    'SELECT 1'
);
PREPARE stmt_add_idx_bms_trust_id FROM @sql_add_idx_bms_trust_id;
EXECUTE stmt_add_idx_bms_trust_id;
DEALLOCATE PREPARE stmt_add_idx_bms_trust_id;
