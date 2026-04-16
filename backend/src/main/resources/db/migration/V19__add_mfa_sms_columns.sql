-- V18: Add mfa_phone to users table and create mfa_recovery_codes table
-- These support SMS-OTP MFA and recovery code functionality for Temple Authority registration.
-- ─────────────────────────────────────────────────────────────────────────────────────────────

-- Add mfa_phone column to users (required for SMS_OTP MFA type)
ALTER TABLE users
    ADD COLUMN mfa_phone VARCHAR(15) DEFAULT NULL
        COMMENT 'Phone number used for SMS OTP MFA; set when mfa_type = SMS_OTP';

-- mfa_recovery_codes: single-use bcrypt-hashed codes generated at MFA setup.
-- 8 codes per user. used_at IS NULL means available; NOT NULL means consumed.
-- Schema per 11_user_auth_schema.txt §3.4
CREATE TABLE mfa_recovery_codes (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    user_id     BIGINT      NOT NULL,
    code_hash   VARCHAR(72) NOT NULL COMMENT 'bcrypt hash of plain code; cost >= 12',
    used_at     DATETIME    DEFAULT NULL COMMENT 'NULL = available; NOT NULL = consumed',
    created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted  TINYINT(1)  NOT NULL DEFAULT 0,
    created_by  BIGINT,
    updated_by  BIGINT,
    updated_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_rc_user_available (user_id, used_at),
    CONSTRAINT fk_rc_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
