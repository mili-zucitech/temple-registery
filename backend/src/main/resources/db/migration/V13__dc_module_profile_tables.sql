-- ============================================================
-- V13: DC Module Pre-Implementation — Temple Profile Tables
-- dc_e2e Section 4.4: temple_profile_staging, temple_profile_current,
-- temple_profile_history
-- Creation order: staging first (no deps), then current and history (reference temples).
-- ============================================================

-- -------------------------------------------------------------------
-- temple_profile_staging: draft submissions from Temple Authority
-- awaiting DC review. At most one row per temple may be PENDING_REVIEW.
-- -------------------------------------------------------------------
CREATE TABLE temple_profile_staging (
    id                          BIGINT        NOT NULL AUTO_INCREMENT,
    temple_id                   BIGINT        NOT NULL,
    version                     INT           NOT NULL DEFAULT 1 COMMENT '1-based, increments on rejection+resubmission',
    status                      VARCHAR(20)   NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT|PENDING_REVIEW|APPROVED|REJECTED|SUPERSEDED',

    -- Profile content fields
    contact_person_name         VARCHAR(255)  NULL,
    contact_person_designation  VARCHAR(100)  NULL,
    photo_file_path             VARCHAR(1000) NULL COMMENT 'Relative path under TRM_FILE_BASE_DIR/temple_documents/',
    bank_account_number_encrypted TEXT        NULL,
    languages_of_worship        VARCHAR(500)  NULL,
    linked_institutions         JSON          NULL COMMENT 'JSON array of linked mutt/sub-temple names',
    annual_festivals            TEXT          NULL,
    landmark                    VARCHAR(500)  NULL,
    historical_significance     TEXT          NULL,

    -- Review metadata
    submitted_at                DATETIME      NULL,
    submitted_by                BIGINT        NULL,
    reviewed_at                 DATETIME      NULL,
    reviewed_by                 BIGINT        NULL,
    review_comment              TEXT          NULL,

    -- Audit fields
    is_deleted                  TINYINT(1)    NOT NULL DEFAULT 0,
    created_at                  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at                  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by                  BIGINT        NULL,
    updated_by                  BIGINT        NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uk_profile_staging_temple_version (temple_id, version),
    INDEX idx_profile_staging_temple_status (temple_id, status),
    CONSTRAINT fk_profile_staging_temple FOREIGN KEY (temple_id) REFERENCES temples (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------
-- temple_profile_current: single currently-approved profile per temple.
-- UNIQUE on temple_id enforces at-most-one constraint.
-- -------------------------------------------------------------------
CREATE TABLE temple_profile_current (
    id                          BIGINT        NOT NULL AUTO_INCREMENT,
    temple_id                   BIGINT        NOT NULL,

    -- Mirrored approved content fields
    contact_person_name         VARCHAR(255)  NULL,
    contact_person_designation  VARCHAR(100)  NULL,
    photo_file_path             VARCHAR(1000) NULL,
    bank_account_number_encrypted TEXT        NULL,
    languages_of_worship        VARCHAR(500)  NULL,
    linked_institutions         JSON          NULL,
    annual_festivals            TEXT          NULL,
    landmark                    VARCHAR(500)  NULL,
    historical_significance     TEXT          NULL,

    published_at                DATETIME      NOT NULL,
    published_by                BIGINT        NOT NULL,
    created_at                  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at                  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id),
    UNIQUE KEY uk_profile_current_temple (temple_id),
    CONSTRAINT fk_profile_current_temple FOREIGN KEY (temple_id) REFERENCES temples (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------
-- temple_profile_history: append-only archive of superseded profiles.
-- No soft-delete, no UPDATE ever.
-- -------------------------------------------------------------------
CREATE TABLE temple_profile_history (
    id                          BIGINT        NOT NULL AUTO_INCREMENT,
    temple_id                   BIGINT        NOT NULL,
    version                     INT           NOT NULL,

    -- Archived content fields
    contact_person_name         VARCHAR(255)  NULL,
    contact_person_designation  VARCHAR(100)  NULL,
    photo_file_path             VARCHAR(1000) NULL,
    bank_account_number_encrypted TEXT        NULL,
    languages_of_worship        VARCHAR(500)  NULL,
    linked_institutions         JSON          NULL,
    annual_festivals            TEXT          NULL,
    landmark                    VARCHAR(500)  NULL,
    historical_significance     TEXT          NULL,

    published_at                DATETIME      NOT NULL,
    created_at                  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id),
    INDEX idx_profile_history_temple (temple_id, version),
    CONSTRAINT fk_profile_history_temple FOREIGN KEY (temple_id) REFERENCES temples (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
