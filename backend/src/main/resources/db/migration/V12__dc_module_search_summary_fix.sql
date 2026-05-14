-- ============================================================
-- V12: DC Module Pre-Implementation — temple_search_summary Additions
-- Adds the dc_e2e Section 4.11 columns missing from the original V3 table.
-- Existing columns (name, grade, tradition, district_id, etc.) are kept.
-- ============================================================

ALTER TABLE temple_search_summary
    ADD COLUMN city_id                  BIGINT       NOT NULL DEFAULT 0   COMMENT 'Denormalized from district city; populated by refresh()',
    ADD COLUMN temple_status            VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE | INACTIVE | SUSPENDED',
    ADD COLUMN pending_declarations     INT          NOT NULL DEFAULT 0   COMMENT 'Count of PENDING_REVIEW + CLARIFICATION_REQUESTED + PHYSICAL_VERIFICATION_REQUESTED',
    ADD COLUMN overdue_declarations     INT          NOT NULL DEFAULT 0,
    ADD COLUMN pending_profile_review   INT          NOT NULL DEFAULT 0,
    ADD COLUMN has_active_trust         TINYINT(1)   NOT NULL DEFAULT 0,
    ADD COLUMN has_approved_declaration TINYINT(1)   NOT NULL DEFAULT 0,
    ADD COLUMN last_declaration_at      DATETIME     NULL,
    ADD COLUMN last_profile_update_at   DATETIME     NULL;

-- Additional indexes for DC dashboard and search queries (dc_e2e Section 4.11)
ALTER TABLE temple_search_summary
    ADD INDEX idx_summary_city         (city_id, temple_status),
    ADD INDEX idx_summary_trust        (district_id, has_active_trust),
    ADD INDEX idx_summary_approved_decl (district_id, has_approved_declaration),
    ADD INDEX idx_summary_pending      (district_id, pending_declarations DESC),
    ADD INDEX idx_summary_overdue      (district_id, overdue_declarations DESC);
