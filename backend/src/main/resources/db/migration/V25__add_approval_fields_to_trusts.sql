-- V25__add_approval_fields_to_trusts.sql
-- Add approval fields to trusts table for DC review

ALTER TABLE trusts
    ADD COLUMN is_verified_by_dc TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN dc_flag_reason MEDIUMTEXT;
