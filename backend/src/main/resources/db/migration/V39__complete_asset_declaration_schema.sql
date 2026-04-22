-- ============================================================
-- V39: Complete Asset Declaration Schema
-- Adds runtime columns used by the rich declaration workflow
-- ============================================================

ALTER TABLE asset_declarations
    ADD COLUMN IF NOT EXISTS review_comment TEXT NULL COMMENT 'DC review comment or approval remarks';

ALTER TABLE decl_immov_leased
    ADD COLUMN IF NOT EXISTS monthly_rent DECIMAL(15,2) NULL COMMENT 'Monthly rent for leased properties',
    ADD COLUMN IF NOT EXISTS agreement_document_id BIGINT NULL COMMENT 'Supporting PDF document id';

ALTER TABLE decl_mov_artifact
    ADD COLUMN IF NOT EXISTS material VARCHAR(100) NULL COMMENT 'Material of the artifact/idol',
    ADD COLUMN IF NOT EXISTS age_or_period VARCHAR(100) NULL COMMENT 'Age or historical period',
    ADD COLUMN IF NOT EXISTS provenance TEXT NULL COMMENT 'Provenance / origin details',
    ADD COLUMN IF NOT EXISTS museum_grade_classification VARCHAR(100) NULL COMMENT 'Museum-grade classification';

ALTER TABLE decl_mov_equipment
    ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100) NULL COMMENT 'Serial number';
