-- ============================================================
-- V33: Add DC verification and flagging fields to temples table
-- Enables DC to verify/flag temple profiles with audit trail
-- ============================================================

ALTER TABLE temples
    ADD COLUMN is_verified_by_dc TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'True if DC has verified this temple profile' AFTER verification_status,
    ADD COLUMN verified_by_dc_at DATETIME NULL COMMENT 'Timestamp when DC verified the profile' AFTER is_verified_by_dc,
    ADD COLUMN verified_by_dc_user_id BIGINT NULL COMMENT 'User ID of DC who verified' AFTER verified_by_dc_at,
    ADD COLUMN is_flagged_by_dc TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'True if DC has flagged this temple profile for issues' AFTER verified_by_dc_user_id,
    ADD COLUMN flagged_by_dc_at DATETIME NULL COMMENT 'Timestamp when DC flagged the profile' AFTER is_flagged_by_dc,
    ADD COLUMN flagged_by_dc_user_id BIGINT NULL COMMENT 'User ID of DC who flagged' AFTER flagged_by_dc_at,
    ADD COLUMN dc_rejection_reason TEXT NULL COMMENT 'Reason provided by DC for rejection or flagging' AFTER flagged_by_dc_user_id;

-- Add index for DC verification queries
CREATE INDEX idx_temples_dc_verification ON temples(is_verified_by_dc, is_flagged_by_dc);
