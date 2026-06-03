-- ============================================================================
-- V1: Complete Initial Schema â€” Temple Registry
-- Generated from: consolidated final state of V1â€“V98 migrations
-- All tables derived directly from JPA entity definitions.
-- ============================================================================

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- GEO HIERARCHY
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS states (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    name       VARCHAR(128) NOT NULL,
    code       VARCHAR(3)   NOT NULL,
    is_deleted TINYINT(1)   NOT NULL DEFAULT 0,
    created_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by BIGINT       NOT NULL DEFAULT 0,
    updated_by BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_states_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cities (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    state_id   BIGINT       NOT NULL,
    name       VARCHAR(128) NOT NULL,
    is_deleted TINYINT(1)   NOT NULL DEFAULT 0,
    created_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by BIGINT       NOT NULL DEFAULT 0,
    updated_by BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_cities_state_id (state_id),
    CONSTRAINT fk_cities_state FOREIGN KEY (state_id) REFERENCES states (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS districts (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    city_id    BIGINT       NOT NULL,
    name       VARCHAR(128) NOT NULL,
    is_deleted TINYINT(1)   NOT NULL DEFAULT 0,
    created_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by BIGINT       NOT NULL DEFAULT 0,
    updated_by BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_districts_city_id (city_id),
    CONSTRAINT fk_districts_city FOREIGN KEY (city_id) REFERENCES cities (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS taluks (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    district_id BIGINT       NOT NULL,
    name        VARCHAR(128) NOT NULL,
    is_deleted  TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by  BIGINT       NOT NULL DEFAULT 0,
    updated_by  BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_taluks_district_id (district_id),
    CONSTRAINT fk_taluks_district FOREIGN KEY (district_id) REFERENCES districts (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hoblis (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    taluk_id   BIGINT       NOT NULL,
    name       VARCHAR(128) NOT NULL,
    is_deleted TINYINT(1)   NOT NULL DEFAULT 0,
    created_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by BIGINT       NOT NULL DEFAULT 0,
    updated_by BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_hoblis_taluk_id (taluk_id),
    CONSTRAINT fk_hoblis_taluk FOREIGN KEY (taluk_id) REFERENCES taluks (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- AUTH
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS users (
    id                          BIGINT       NOT NULL AUTO_INCREMENT,
    username                    VARCHAR(100) NOT NULL,
    email                       VARCHAR(255) NOT NULL,
    password_hash               VARCHAR(255) NOT NULL,
    full_name                   VARCHAR(200) NOT NULL,
    mobile                      VARCHAR(15),
    role                        VARCHAR(30)  NOT NULL,
    is_active                   TINYINT(1)   NOT NULL DEFAULT 1,
    district_id                 BIGINT,
    city_id                     BIGINT,
    temple_id                   BIGINT,
    mfa_type                    VARCHAR(20),
    mfa_secret                  VARCHAR(255),
    mfa_phone                   VARCHAR(15),
    failed_login_count          INT          NOT NULL DEFAULT 0,
    locked_until                DATETIME,
    last_login_at               DATETIME,
    aadhaar_verified            TINYINT(1)   NOT NULL DEFAULT 0,
    aadhaar_number              VARCHAR(12),
    password_reset_token_hash   VARCHAR(64),
    password_reset_expires_at   DATETIME,
    is_deleted                  TINYINT(1)   NOT NULL DEFAULT 0,
    created_at                  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at                  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by                  BIGINT       NOT NULL DEFAULT 0,
    updated_by                  BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_username (username),
    UNIQUE KEY uk_users_email    (email),
    INDEX idx_users_role         (role),
    INDEX idx_users_district_id  (district_id),
    INDEX idx_users_temple_id    (temple_id),
    INDEX idx_users_is_deleted   (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id           BIGINT      NOT NULL AUTO_INCREMENT,
    user_id      BIGINT      NOT NULL,
    token_hash   VARCHAR(64) NOT NULL,
    expires_at   DATETIME    NOT NULL,
    revoked_at   DATETIME,
    created_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_rt_token_hash (token_hash),
    INDEX idx_rt_user_id        (user_id),
    CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mfa_recovery_codes (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    user_id    BIGINT       NOT NULL,
    code_hash  VARCHAR(72)  NOT NULL,
    used_at    DATETIME,
    is_deleted TINYINT(1)   NOT NULL DEFAULT 0,
    created_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by BIGINT       NOT NULL DEFAULT 0,
    updated_by BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_rc_user_available (user_id, used_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- TEMPLES
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS temples (
    id                       BIGINT         NOT NULL AUTO_INCREMENT,
    version                  BIGINT         NOT NULL DEFAULT 0         COMMENT '@Version optimistic lock',
    registration_number      VARCHAR(50)    NOT NULL,
    name                     VARCHAR(255)   NOT NULL,
    alias_name               VARCHAR(255),
    grade                    VARCHAR(5)     NOT NULL,
    primary_deity            VARCHAR(150)   NOT NULL,
    tradition                VARCHAR(30),
    year_established         INT,
    history                  TEXT,
    -- Address
    door_number              VARCHAR(50),
    street                   VARCHAR(255),
    village_town             VARCHAR(150),
    pin_code                 VARCHAR(10),
    hobli_id                 BIGINT,
    taluk_id                 BIGINT,
    city_id                  BIGINT,
    district_id              BIGINT         NOT NULL,
    -- GPS
    latitude                 DECIMAL(10,7),
    longitude                DECIMAL(11,7),
    place_id                 VARCHAR(500)                              COMMENT 'Google Maps place_id',
    formatted_address        VARCHAR(1000)                             COMMENT 'Human-readable formatted address',
    -- Contact
    contact_name             VARCHAR(200),
    contact_designation      VARCHAR(150),
    contact_mobile           VARCHAR(15),
    contact_email            VARCHAR(255),
    -- Media / content
    photo_url                VARCHAR(500),
    website                  VARCHAR(500),
    languages_of_worship     VARCHAR(255),
    linked_institutions      JSON,
    annual_festivals         TEXT,
    landmark                 VARCHAR(500),
    historical_significance  TEXT,
    bank_name                VARCHAR(100),
    bank_ifsc                VARCHAR(11),
    -- Workflow flags
    trust_registered         TINYINT(1)     NOT NULL DEFAULT 0,
    asset_declaration_status VARCHAR(30),
    status                   VARCHAR(20)    NOT NULL DEFAULT 'ACTIVE',
    verification_status      VARCHAR(20)    NOT NULL DEFAULT 'UNVERIFIED',
    dc_rejection_reason      TEXT,
    -- Audit
    is_deleted               TINYINT(1)     NOT NULL DEFAULT 0,
    created_at               DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at               DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by               BIGINT         NOT NULL DEFAULT 0,
    updated_by               BIGINT         NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_temples_registration (registration_number),
    INDEX idx_temples_district_id  (district_id),
    INDEX idx_temples_hobli_id     (hobli_id),
    INDEX idx_temples_grade        (grade),
    INDEX idx_temples_registration (registration_number),
    INDEX idx_temples_place_id     (place_id),
    INDEX idx_temples_is_deleted   (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS temple_search_summary (
    id                      BIGINT       NOT NULL AUTO_INCREMENT,
    temple_id               BIGINT       NOT NULL,
    name                    VARCHAR(255) NOT NULL,
    registration_number     VARCHAR(50),
    grade                   VARCHAR(5),
    primary_deity           VARCHAR(150),
    tradition               VARCHAR(30),
    hobli_id                BIGINT,
    taluk_id                BIGINT,
    district_id             BIGINT       NOT NULL,
    city_id                 BIGINT,
    temple_status           VARCHAR(20),
    trust_registered        TINYINT(1),
    asset_declaration_status VARCHAR(30),
    year_established        INT,
    photo_url               VARCHAR(500),
    pending_declarations    INT,
    overdue_declarations    INT,
    pending_profile_review  INT,
    has_active_trust        TINYINT(1),
    has_approved_declaration TINYINT(1),
    last_declaration_at     DATETIME,
    last_profile_update_at  DATETIME,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tss_temple_id (temple_id),
    FULLTEXT INDEX ft_tss_name  (name),
    INDEX idx_tss_district_id   (district_id),
    INDEX idx_tss_grade         (grade),
    INDEX idx_tss_temple_id     (temple_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS temple_photos (
    id                BIGINT         NOT NULL AUTO_INCREMENT,
    temple_id         BIGINT         NOT NULL,
    file_path         VARCHAR(500)   NOT NULL,
    original_filename VARCHAR(255),
    width             INT,
    height            INT,
    is_primary        TINYINT(1)     NOT NULL DEFAULT 0,
    display_order     INT,
    version           BIGINT         NOT NULL DEFAULT 0,
    is_deleted        TINYINT(1)     NOT NULL DEFAULT 0,
    created_at        DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at        DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by        BIGINT         NOT NULL DEFAULT 0,
    updated_by        BIGINT         NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_temple_photos_temple_id  (temple_id),
    INDEX idx_temple_photos_is_deleted (is_deleted),
    CONSTRAINT fk_temple_photos_temple FOREIGN KEY (temple_id) REFERENCES temples (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Profile staging â€” awaiting DC review
CREATE TABLE IF NOT EXISTS temple_profile_staging (
    id                          BIGINT        NOT NULL AUTO_INCREMENT,
    temple_id                   BIGINT        NOT NULL,
    -- Workflow state
    status                      VARCHAR(32)   NOT NULL DEFAULT 'DRAFT',
    version                     INT           NOT NULL DEFAULT 1,
    version_number              INT           NOT NULL DEFAULT 1      COMMENT 'Business version counter',
    lock_version                BIGINT        NOT NULL DEFAULT 0      COMMENT 'JPA @Version optimistic lock',
    -- Contact / identity fields
    phone                       VARCHAR(15),
    email                       VARCHAR(255),
    website                     VARCHAR(500),
    contact_person_name         VARCHAR(255),
    contact_person_designation  VARCHAR(100),
    -- Media / financials
    photo_file_path             VARCHAR(1000),
    bank_name                   VARCHAR(100),
    bank_account_number_encrypted TEXT                               COMMENT 'AES-GCM encrypted',
    bank_ifsc                   VARCHAR(11),
    -- Profile content
    languages_of_worship        VARCHAR(500),
    linked_institutions         JSON,
    description                 TEXT,
    annual_festivals            TEXT,
    landmark                    VARCHAR(500),
    historical_significance     TEXT,
    -- Identity fields editable by TA (require DC approval)
    alias_name                  VARCHAR(255),
    primary_deity               VARCHAR(150),
    grade                       CHAR(1),
    tradition                   VARCHAR(50),
    hobli_id                    BIGINT,
    address_line1               VARCHAR(255),
    pin_code                    VARCHAR(6),
    latitude                    DECIMAL(10,7),
    longitude                   DECIMAL(10,7),
    place_id                    VARCHAR(500)                         COMMENT 'Google Maps place_id',
    formatted_address           VARCHAR(1000)                        COMMENT 'Human-readable formatted address',
    year_established            SMALLINT,
    -- Review metadata
    review_comment              TEXT,
    reviewed_at                 DATETIME,
    reviewed_by                 BIGINT,
    -- Audit
    is_deleted                  TINYINT(1)    NOT NULL DEFAULT 0,
    created_at                  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at                  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by                  BIGINT        NOT NULL DEFAULT 0,
    updated_by                  BIGINT        NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_profile_staging_temple_version (temple_id, version),
    INDEX idx_profile_staging_temple_status (temple_id, status),
    CONSTRAINT fk_profile_staging_temple FOREIGN KEY (temple_id) REFERENCES temples (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Single currently-approved profile per temple
CREATE TABLE IF NOT EXISTS temple_profile_current (
    id                          BIGINT        NOT NULL AUTO_INCREMENT,
    temple_id                   BIGINT        NOT NULL,
    phone                       VARCHAR(15),
    email                       VARCHAR(255),
    website                     VARCHAR(500),
    contact_person_name         VARCHAR(255),
    contact_person_designation  VARCHAR(100),
    photo_file_path             VARCHAR(1000),
    bank_name                   VARCHAR(100),
    bank_account_number_encrypted TEXT,
    bank_ifsc                   VARCHAR(11),
    languages_of_worship        VARCHAR(500),
    linked_institutions         JSON,
    description                 TEXT,
    annual_festivals            TEXT,
    landmark                    VARCHAR(500),
    historical_significance     TEXT,
    published_at                DATETIME(6)   NOT NULL,
    published_by                BIGINT        NOT NULL,
    created_at                  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at                  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_profile_current_temple (temple_id),
    CONSTRAINT fk_profile_current_temple FOREIGN KEY (temple_id) REFERENCES temples (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Append-only archive of superseded profiles
CREATE TABLE IF NOT EXISTS temple_profile_history (
    id                          BIGINT        NOT NULL AUTO_INCREMENT,
    temple_id                   BIGINT        NOT NULL,
    version                     INT           NOT NULL,
    phone                       VARCHAR(15),
    email                       VARCHAR(255),
    website                     VARCHAR(500),
    contact_person_name         VARCHAR(255),
    contact_person_designation  VARCHAR(100),
    photo_file_path             VARCHAR(1000),
    bank_name                   VARCHAR(100),
    bank_account_number_encrypted TEXT,
    bank_ifsc                   VARCHAR(11),
    languages_of_worship        VARCHAR(500),
    linked_institutions         JSON,
    description                 TEXT,
    annual_festivals            TEXT,
    landmark                    VARCHAR(500),
    historical_significance     TEXT,
    published_at                DATETIME(6)   NOT NULL,
    created_at                  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    INDEX idx_profile_history_temple (temple_id, version),
    CONSTRAINT fk_profile_history_temple FOREIGN KEY (temple_id) REFERENCES temples (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Append-only temple lifecycle event log
CREATE TABLE IF NOT EXISTS temple_timeline_events (
    id                    BIGINT         NOT NULL AUTO_INCREMENT,
    temple_id             BIGINT         NOT NULL,
    event_type            VARCHAR(40)    NOT NULL,
    event_code            VARCHAR(64)    NOT NULL,
    module_name           VARCHAR(40),
    entity_name           VARCHAR(255),
    title                 VARCHAR(255)   NOT NULL,
    description           TEXT,
    metadata              JSON,
    reference_id          BIGINT,
    old_status            VARCHAR(40),
    new_status            VARCHAR(40),
    workflow_action       VARCHAR(40),
    source_transition_id  BIGINT         UNIQUE,
    performer_id          BIGINT         NOT NULL,
    performer_name        VARCHAR(255),
    performer_role        VARCHAR(32)    NOT NULL,
    comment               TEXT,
    created_by_system     TINYINT(1)     NOT NULL DEFAULT 0,
    occurred_at           DATETIME(6)    NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_tte_temple_id    (temple_id),
    INDEX idx_tte_event_type   (event_type),
    INDEX idx_tte_occurred_at  (occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- TRUST MODULE
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS trusts (
    id                          BIGINT        NOT NULL AUTO_INCREMENT,
    lock_version                BIGINT        NOT NULL DEFAULT 0,
    temple_id                   BIGINT        NOT NULL,
    trust_name                  VARCHAR(255)  NOT NULL,
    trust_registration_number   VARCHAR(100)  NOT NULL,
    date_of_registration        DATE          NOT NULL,
    registering_authority       VARCHAR(255)  NOT NULL,
    trust_type                  VARCHAR(30)   NOT NULL,
    trust_pan_number            TEXT          NOT NULL                COMMENT 'AES-GCM encrypted PAN',
    bank_account_number         TEXT          NOT NULL                COMMENT 'AES-GCM encrypted account number',
    bank_name_and_branch        VARCHAR(255)  NOT NULL,
    annual_income               DECIMAL(15,2),
    status                      VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
    dissolution_date            DATE,
    dissolution_reason          TEXT,
    system_verification_status  VARCHAR(30),
    send_back_reason            TEXT,
    approved_data               TEXT                                  COMMENT 'JSON snapshot at last approval',
    is_deleted                  TINYINT(1)    NOT NULL DEFAULT 0,
    created_at                  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at                  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by                  BIGINT        NOT NULL DEFAULT 0,
    updated_by                  BIGINT        NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_trust_temple_id           (temple_id),
    INDEX idx_trust_registration_number (trust_registration_number),
    CONSTRAINT fk_trust_temple FOREIGN KEY (temple_id) REFERENCES temples (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS trust_financials (
    id                  BIGINT         NOT NULL AUTO_INCREMENT,
    trust_id            BIGINT         NOT NULL,
    financial_year      VARCHAR(10)    NOT NULL,
    annual_income       DECIMAL(18,2),
    annual_expenditure  DECIMAL(18,2),
    submitted_at        DATETIME,
    document_id         BIGINT,
    is_deleted          TINYINT(1)     NOT NULL DEFAULT 0,
    created_at          DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by          BIGINT         NOT NULL DEFAULT 0,
    updated_by          BIGINT         NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_trust_fin_trust_id (trust_id),
    CONSTRAINT fk_tf_trust FOREIGN KEY (trust_id) REFERENCES trusts (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS board_members (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    lock_version        BIGINT        NOT NULL DEFAULT 0,
    trust_id            BIGINT        NOT NULL,
    full_name           VARCHAR(200)  NOT NULL,
    aadhaar_encrypted   TEXT                                          COMMENT 'AES-GCM encrypted Aadhaar',
    aadhaar_hash        VARCHAR(64)                                   COMMENT 'HMAC-SHA256 for duplicate detection',
    aadhaar_last4       CHAR(4)                                       COMMENT 'Last 4 digits for masked display',
    designation         VARCHAR(150),
    appointment_date    DATE,
    tenure_end_date     DATE,
    contact_number      VARCHAR(15),
    address             TEXT,
    is_current          TINYINT(1)    NOT NULL DEFAULT 1,
    is_verified_by_dc   TINYINT(1)    NOT NULL DEFAULT 0,
    is_deleted          TINYINT(1)    NOT NULL DEFAULT 0,
    created_at          DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by          BIGINT        NOT NULL DEFAULT 0,
    updated_by          BIGINT        NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_board_members_trust_id (trust_id),
    CONSTRAINT fk_bm_trust FOREIGN KEY (trust_id) REFERENCES trusts (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Legacy staging table (retained; no active entity, no FK access from Java)
CREATE TABLE IF NOT EXISTS board_member_staging (
    id               BIGINT        NOT NULL AUTO_INCREMENT,
    trust_id         BIGINT        NOT NULL,
    full_name        VARCHAR(200)  NOT NULL,
    aadhaar_encrypted TEXT,
    designation      VARCHAR(150)  NOT NULL,
    appointment_date DATE          NOT NULL,
    tenure_end_date  DATE,
    contact_number   VARCHAR(15),
    address          TEXT,
    status           VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
    is_deleted       TINYINT(1)    NOT NULL DEFAULT 0,
    created_at       DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at       DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by       BIGINT        NOT NULL DEFAULT 0,
    updated_by       BIGINT        NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_bms_trust_id (trust_id),
    CONSTRAINT fk_bms_trust FOREIGN KEY (trust_id) REFERENCES trusts (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS board_meetings (
    id                   BIGINT      NOT NULL AUTO_INCREMENT,
    trust_id             BIGINT      NOT NULL,
    meeting_date         DATE        NOT NULL,
    agenda               TEXT,
    minutes_document_id  BIGINT,
    is_deleted           TINYINT(1)  NOT NULL DEFAULT 0,
    created_at           DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at           DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by           BIGINT      NOT NULL DEFAULT 0,
    updated_by           BIGINT      NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_board_meetings_trust_id (trust_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- EMPLOYEES & CONTRACTORS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS employees (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    temple_id       BIGINT       NOT NULL,
    employee_ref    VARCHAR(50),
    full_name       VARCHAR(200) NOT NULL,
    employee_type   VARCHAR(30)  NOT NULL,
    designation     VARCHAR(150),
    date_of_joining DATE,
    salary_grade    VARCHAR(50),
    mobile          VARCHAR(15),
    address         TEXT,
    is_hereditary   TINYINT(1)   NOT NULL DEFAULT 0,
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    date_of_leaving DATE,
    is_deleted      TINYINT(1)   NOT NULL DEFAULT 0,
    created_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by      BIGINT       NOT NULL DEFAULT 0,
    updated_by      BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_employees_temple_id    (temple_id),
    INDEX idx_employees_status       (status),
    INDEX idx_employees_employee_ref (employee_ref),
    INDEX idx_employees_employee_type (employee_type),
    UNIQUE KEY uk_employees_temple_ref (temple_id, employee_ref),
    CONSTRAINT fk_emp_temple FOREIGN KEY (temple_id) REFERENCES temples (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contractors (
    id                   BIGINT         NOT NULL AUTO_INCREMENT,
    temple_id            BIGINT         NOT NULL,
    company_name         VARCHAR(255)   NOT NULL,
    gst_number           VARCHAR(30),
    service_type         VARCHAR(128),
    contract_reference   VARCHAR(100),
    work_order_date      DATE,
    contract_start_date  DATE,
    contract_end_date    DATE,
    contract_value       DECIMAL(18,2),
    payment_status       VARCHAR(50),
    document_ids         TEXT                                          COMMENT 'Comma-separated document IDs',
    is_verified_by_dc    TINYINT(1)     NOT NULL DEFAULT 0,
    dc_flag_reason       TEXT,
    is_gst_valid         TINYINT(1),
    is_payment_pending   TINYINT(1)     NOT NULL DEFAULT 0,
    is_deleted           TINYINT(1)     NOT NULL DEFAULT 0,
    created_at           DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at           DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by           BIGINT         NOT NULL DEFAULT 0,
    updated_by           BIGINT         NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_contractors_temple_id (temple_id),
    CONSTRAINT fk_con_temple FOREIGN KEY (temple_id) REFERENCES temples (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- ASSET DECLARATIONS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS asset_declarations (
    id                               BIGINT         NOT NULL AUTO_INCREMENT,
    lock_version                     BIGINT         NOT NULL DEFAULT 0,
    temple_id                        BIGINT         NOT NULL,
    district_id                      BIGINT         NOT NULL,
    financial_year                   VARCHAR(7),
    version_number                   INT            NOT NULL DEFAULT 1,
    status                           VARCHAR(40)    NOT NULL DEFAULT 'DRAFT',
    -- Immovable assets
    agricultural_land_acres          DECIMAL(12,4),
    agricultural_land_value          DECIMAL(18,2),
    buildings_sqft                   DECIMAL(12,2),
    buildings_value                  DECIMAL(18,2),
    leased_properties_count          INT,
    leased_properties_value          DECIMAL(18,2),
    other_land_value                 DECIMAL(18,2),
    -- Movable assets
    gold_grams                       DECIMAL(12,3),
    silver_grams                     DECIMAL(12,3),
    idols_count                      INT,
    vehicles_count                   INT,
    financial_assets_value           DECIMAL(18,2),
    other_movable_value              DECIMAL(18,2),
    -- Income / expenditure
    annual_income                    DECIMAL(18,2),
    annual_expenditure               DECIMAL(18,2),
    -- Workflow
    due_date                         DATE,
    submitted_at                     DATETIME,
    submitted_by                     BIGINT,
    reviewed_at                      DATETIME,
    reviewed_by                      BIGINT,
    review_comment                   TEXT,
    acknowledged_at                  DATETIME,
    acknowledgement_number           VARCHAR(50),
    acknowledgement_doc_file_path    VARCHAR(1000),
    clarification_round              INT            NOT NULL DEFAULT 0,
    is_overdue                       TINYINT(1)     NOT NULL DEFAULT 0,
    overdue_flagged_at               DATETIME,
    snapshot_json                    JSON,
    snapshot_file_path               VARCHAR(1000),
    -- Governance (DC-only)
    system_verification_status       VARCHAR(30),
    send_back_reason                 TEXT,
    physical_verification_status     VARCHAR(30),
    -- Audit
    is_deleted                       TINYINT(1)     NOT NULL DEFAULT 0,
    created_at                       DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at                       DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by                       BIGINT         NOT NULL DEFAULT 0,
    updated_by                       BIGINT         NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_decl_temple_id   (temple_id),
    INDEX idx_decl_status      (status),
    INDEX idx_decl_district_id (district_id),
    INDEX idx_decl_temple_year (temple_id, financial_year),
    INDEX idx_decl_overdue     (is_overdue, status, temple_id),
    CONSTRAINT fk_ad_temple FOREIGN KEY (temple_id) REFERENCES temples (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asset_declaration_versions (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    declaration_id      BIGINT      NOT NULL,
    version_number      INT         NOT NULL,
    snapshot_json       JSON        NOT NULL,
    created_by_user_id  BIGINT      NOT NULL,
    is_deleted          TINYINT(1)  NOT NULL DEFAULT 0,
    created_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by          BIGINT      NOT NULL DEFAULT 0,
    updated_by          BIGINT      NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_decl_version_decl_id (declaration_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS declaration_clarifications (
    id             BIGINT      NOT NULL AUTO_INCREMENT,
    declaration_id BIGINT      NOT NULL,
    direction      VARCHAR(16) NOT NULL,
    message        TEXT        NOT NULL,
    author_id      BIGINT      NOT NULL,
    created_at     DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    INDEX idx_dc_declaration_id (declaration_id),
    CONSTRAINT fk_dc_declaration FOREIGN KEY (declaration_id) REFERENCES asset_declarations (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert-only sequence table for acknowledgement number generation
CREATE TABLE IF NOT EXISTS acknowledgement_sequences (
    seq_id         BIGINT      NOT NULL AUTO_INCREMENT,
    financial_year VARCHAR(7)  NOT NULL,
    created_at     DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (seq_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Append-only audit trail for physical verification status changes
CREATE TABLE IF NOT EXISTS physical_verification_history (
    id                BIGINT      NOT NULL AUTO_INCREMENT,
    declaration_id    BIGINT      NOT NULL,
    dc_user_id        BIGINT      NOT NULL,
    previous_status   VARCHAR(50) NOT NULL,
    new_status        VARCHAR(50) NOT NULL,
    notes             TEXT,
    occurred_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    INDEX idx_pvh_declaration_id (declaration_id),
    INDEX idx_pvh_dc_user_id     (dc_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- DOCUMENTS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS documents (
    id                BIGINT        NOT NULL AUTO_INCREMENT,
    owner_type        VARCHAR(32)   NOT NULL,
    owner_id          BIGINT        NOT NULL,
    reference_id      BIGINT,
    original_filename VARCHAR(255)  NOT NULL,
    s3_key            VARCHAR(512)  NOT NULL,
    mime_type         VARCHAR(128)  NOT NULL,
    file_size_bytes   BIGINT        NOT NULL,
    document_label    VARCHAR(128),
    is_deleted        TINYINT(1)    NOT NULL DEFAULT 0,
    created_at        DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at        DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by        BIGINT        NOT NULL DEFAULT 0,
    updated_by        BIGINT        NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_doc_owner        (owner_type, owner_id),
    INDEX idx_doc_reference_id (reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS document_access_logs (
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    document_id   BIGINT      NOT NULL,
    accessor_id   BIGINT      NOT NULL,
    accessor_role VARCHAR(32) NOT NULL,
    access_type   VARCHAR(16) NOT NULL,
    accessed_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    INDEX idx_da_doc_id      (document_id),
    INDEX idx_da_accessor_id (accessor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- NOTIFICATIONS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS notification_events (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    recipient_id    BIGINT       NOT NULL,
    event_type      VARCHAR(64)  NOT NULL,
    reference_id    BIGINT,
    reference_type  VARCHAR(32),
    channel         VARCHAR(16)  NOT NULL,
    status          VARCHAR(16)  NOT NULL,
    failure_reason  VARCHAR(512),
    dispatched_at   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    INDEX idx_ne_recipient_id (recipient_id),
    INDEX idx_ne_event_type   (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS in_app_notifications (
    id                          BIGINT        NOT NULL AUTO_INCREMENT,
    user_id                     BIGINT        NOT NULL,
    title                       VARCHAR(255)  NOT NULL,
    body                        TEXT          NOT NULL,
    priority                    VARCHAR(20)   DEFAULT 'MEDIUM',
    category                    VARCHAR(30)   DEFAULT 'SYSTEM',
    notification_type           VARCHAR(50),
    action_url                  VARCHAR(255),
    redirect_url                VARCHAR(512),
    reference_id                BIGINT,
    reference_type              VARCHAR(32),
    temple_id                   BIGINT,
    temple_name                 VARCHAR(255),
    action_by_name              VARCHAR(255),
    action_by_role              VARCHAR(50),
    workflow_status             VARCHAR(50),
    is_read                     TINYINT(1)    NOT NULL DEFAULT 0,
    read_at                     DATETIME,
    requires_acknowledgement    TINYINT(1)    NOT NULL DEFAULT 0,
    acknowledged_at             DATETIME,
    acknowledged_by             BIGINT,
    deleted_at                  DATETIME,
    idempotency_key             VARCHAR(255),
    created_at                  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY idx_ian_idempotency_key  (idempotency_key),
    INDEX idx_ian_user_id_read  (user_id, is_read),
    INDEX idx_ian_created_at    (created_at DESC),
    INDEX idx_ian_priority      (priority),
    INDEX idx_ian_category      (category),
    INDEX idx_ian_temple_id     (temple_id),
    INDEX idx_ian_deleted_at    (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_rules (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    event_type      VARCHAR(40)  NOT NULL,
    entity_type     VARCHAR(40)  NOT NULL,
    action          VARCHAR(40)  NOT NULL,
    recipient_type  VARCHAR(20)  NOT NULL,
    channel         VARCHAR(20)  NOT NULL,
    priority        VARCHAR(10)  NOT NULL,
    template_key    VARCHAR(100) NOT NULL,
    enabled         TINYINT(1)   NOT NULL DEFAULT 1,
    description     VARCHAR(500),
    is_deleted      TINYINT(1)   NOT NULL DEFAULT 0,
    created_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by      BIGINT       NOT NULL DEFAULT 0,
    updated_by      BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_nr_event_action (event_type, action),
    INDEX idx_nr_entity_type  (entity_type),
    INDEX idx_nr_enabled      (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_outbox (
    id                      BIGINT       NOT NULL AUTO_INCREMENT,
    event_payload_json      JSON         NOT NULL,
    workflow_instance_id    BIGINT,
    event_type              VARCHAR(40)  NOT NULL,
    dispatch_status         VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    created_at_instant      DATETIME(6)  NOT NULL,
    dispatched_at           DATETIME(6),
    retry_count             INT          NOT NULL DEFAULT 0,
    last_error              TEXT,
    is_deleted              TINYINT(1)   NOT NULL DEFAULT 0,
    created_at              DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at              DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by              BIGINT       NOT NULL DEFAULT 0,
    updated_by              BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_no_status_created        (dispatch_status, created_at_instant),
    INDEX idx_no_workflow_instance_id  (workflow_instance_id),
    INDEX idx_no_event_type            (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    user_id         BIGINT      NOT NULL,
    module_type     VARCHAR(30) NOT NULL,
    in_app_enabled  TINYINT(1)  NOT NULL DEFAULT 1,
    email_enabled   TINYINT(1)  NOT NULL DEFAULT 1,
    is_deleted      TINYINT(1)  NOT NULL DEFAULT 0,
    created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by      BIGINT      NOT NULL DEFAULT 0,
    updated_by      BIGINT      NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_module   (user_id, module_type),
    INDEX idx_unp_user_id       (user_id),
    CONSTRAINT fk_unp_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_delivery_logs (
    id                      BIGINT        NOT NULL AUTO_INCREMENT,
    notification_event_id   BIGINT        NOT NULL,
    recipient_email         VARCHAR(255)  NOT NULL,
    subject                 VARCHAR(500)  NOT NULL,
    template_name           VARCHAR(100)  NOT NULL,
    status                  VARCHAR(20)   NOT NULL,
    sent_at                 DATETIME(6),
    failure_reason          VARCHAR(1000),
    retry_count             INT           NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_edl_notification_event (notification_event_id),
    INDEX idx_edl_recipient_email    (recipient_email),
    INDEX idx_edl_status             (status),
    INDEX idx_edl_sent_at            (sent_at DESC),
    CONSTRAINT fk_edl_notification_event FOREIGN KEY (notification_event_id)
        REFERENCES notification_events (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_action_log (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    notification_id BIGINT       NOT NULL,
    action_type     VARCHAR(50)  NOT NULL,
    performed_by    BIGINT       NOT NULL,
    performed_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    notes           TEXT,
    PRIMARY KEY (id),
    INDEX idx_nal_notification_id (notification_id),
    INDEX idx_nal_performed_by    (performed_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- AUDIT
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS audit_data_events (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    actor_id    BIGINT      NOT NULL,
    actor_role  VARCHAR(32) NOT NULL,
    action      VARCHAR(32) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id   BIGINT      NOT NULL,
    detail      TEXT,
    occurred_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    INDEX idx_ade_actor_id (actor_id),
    INDEX idx_ade_entity   (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_auth_events (
    id          BIGINT        NOT NULL AUTO_INCREMENT,
    user_id     BIGINT,
    username    VARCHAR(128),
    event_type  VARCHAR(64)   NOT NULL,
    ip_address  VARCHAR(45),
    outcome     VARCHAR(16)   NOT NULL,
    detail      VARCHAR(512),
    occurred_at DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    INDEX idx_aae_user_id    (user_id),
    INDEX idx_aae_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_export_events (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    actor_id        BIGINT       NOT NULL,
    actor_role      VARCHAR(32)  NOT NULL,
    export_type     VARCHAR(32)  NOT NULL,
    filter_summary  TEXT,
    record_count    INT,
    occurred_at     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    INDEX idx_aee_actor_id    (actor_id),
    INDEX idx_aee_export_type (export_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS governance_action_history (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    entity_id           BIGINT      NOT NULL,
    entity_type         VARCHAR(64) NOT NULL,
    dc_user_id          BIGINT      NOT NULL,
    action              VARCHAR(64) NOT NULL,
    comment             TEXT,
    governance_version  INT         NOT NULL DEFAULT 1,
    timestamp           DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    INDEX idx_gov_action_entity    (entity_type, entity_id),
    INDEX idx_gov_action_dc_user   (dc_user_id),
    INDEX idx_gov_action_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- OBSERVATIONS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS observations (
    id                    BIGINT       NOT NULL AUTO_INCREMENT,
    temple_id             BIGINT       NOT NULL,
    entity_type           VARCHAR(40)  NOT NULL,
    entity_id             BIGINT       NOT NULL,
    title                 VARCHAR(255) NOT NULL,
    description           TEXT         NOT NULL,
    severity              VARCHAR(20)  NOT NULL DEFAULT 'MEDIUM',
    status                VARCHAR(20)  NOT NULL DEFAULT 'OPEN',
    raised_by_user_id     BIGINT       NOT NULL,
    assigned_to_user_id   BIGINT,
    evidence_document_ids JSON,
    resolution_note       TEXT,
    closed_at             DATETIME,
    is_deleted            TINYINT(1)   NOT NULL DEFAULT 0,
    created_at            DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at            DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by            BIGINT       NOT NULL DEFAULT 0,
    updated_by            BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_obs_temple_id (temple_id),
    INDEX idx_obs_status    (status),
    INDEX idx_obs_severity  (severity),
    INDEX idx_obs_raised_by (raised_by_user_id),
    INDEX idx_obs_entity    (entity_type, entity_id),
    CONSTRAINT fk_obs_temple FOREIGN KEY (temple_id) REFERENCES temples (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- SYSTEM CONFIG
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS system_config (
    id           BIGINT        NOT NULL AUTO_INCREMENT,
    config_key   VARCHAR(100)  NOT NULL,
    config_value VARCHAR(1000) NOT NULL,
    data_type    VARCHAR(20)   NOT NULL DEFAULT 'STRING',
    category     VARCHAR(30)   NOT NULL DEFAULT 'FEATURE',
    description  VARCHAR(500),
    is_active    TINYINT(1)    NOT NULL DEFAULT 1,
    is_deleted   TINYINT(1)    NOT NULL DEFAULT 0,
    created_at   DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at   DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by   BIGINT        NOT NULL DEFAULT 0,
    updated_by   BIGINT        NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sc_key  (config_key),
    INDEX idx_sc_key      (config_key),
    INDEX idx_sc_category (category),
    INDEX idx_sc_active   (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- EXPORT / RATE LIMITING / IDEMPOTENCY
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS export_job_records (
    job_id        VARCHAR(64)  NOT NULL,
    actor_user_id BIGINT       NOT NULL,
    district_id   BIGINT,
    created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    expires_at    DATETIME(6)  NOT NULL,
    PRIMARY KEY (job_id),
    INDEX idx_export_job_actor   (actor_user_id),
    INDEX idx_export_job_expires (expires_at),
    CONSTRAINT fk_export_job_actor FOREIGN KEY (actor_user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DC module idempotency (HTTP-level deduplication)
CREATE TABLE IF NOT EXISTS idempotency_records (
    id               BIGINT            NOT NULL AUTO_INCREMENT,
    actor_user_id    BIGINT            NOT NULL,
    idempotency_key  VARCHAR(255)      NOT NULL,
    response_body    MEDIUMTEXT        NOT NULL,
    response_status  SMALLINT UNSIGNED NOT NULL,
    created_at       DATETIME(6)       NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    expires_at       DATETIME(6)       NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_idempotency_actor_key (actor_user_id, idempotency_key),
    INDEX idx_idempotency_lookup (actor_user_id, idempotency_key),
    INDEX idx_idempotency_expiry (expires_at),
    CONSTRAINT fk_idempotency_user FOREIGN KEY (actor_user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rate_request_log (
    id              BIGINT        NOT NULL AUTO_INCREMENT,
    user_id         BIGINT        NOT NULL,
    endpoint_key    VARCHAR(100)  NOT NULL,
    window_start    DATETIME(6)   NOT NULL,
    request_count   INT UNSIGNED  NOT NULL DEFAULT 1,
    last_request_at DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_rrl_user_endpoint_window (user_id, endpoint_key, window_start),
    INDEX idx_rrl_lookup (user_id, endpoint_key, window_start),
    CONSTRAINT fk_rrl_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- WORKFLOW ENGINE
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS workflow_instances (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    entity_type         VARCHAR(30)  NOT NULL,
    entity_id           BIGINT       NOT NULL,
    status              VARCHAR(40)  NOT NULL,
    sub_status          VARCHAR(50),
    lock_version        BIGINT       NOT NULL DEFAULT 0,
    version_number      INT          NOT NULL DEFAULT 1,
    current_actor_role  VARCHAR(20),
    created_by_user_id  BIGINT       NOT NULL,
    temple_id           BIGINT       NOT NULL,
    district_id         BIGINT       NOT NULL,
    deadline_at         DATETIME(6),
    submitted_at        DATETIME(6),
    status_updated_at   DATETIME(6),
    metadata_json       JSON,
    is_deleted          TINYINT(1)   NOT NULL DEFAULT 0,
    created_at          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by          BIGINT       NOT NULL DEFAULT 0,
    updated_by          BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_wi_entity         (entity_type, entity_id),
    INDEX idx_wi_status             (status),
    INDEX idx_wi_district_status    (district_id, status),
    INDEX idx_wi_temple_status      (temple_id, status),
    INDEX idx_wi_created_by         (created_by_user_id),
    INDEX idx_wi_status_updated     (status_updated_at),
    INDEX idx_wi_deadline           (deadline_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workflow_transitions (
    id                              BIGINT       NOT NULL AUTO_INCREMENT,
    workflow_instance_id            BIGINT       NOT NULL,
    from_status                     VARCHAR(40),
    to_status                       VARCHAR(40)  NOT NULL,
    from_sub_status                 VARCHAR(50),
    to_sub_status                   VARCHAR(50),
    action                          VARCHAR(40)  NOT NULL,
    actor_id                        BIGINT       NOT NULL,
    actor_role                      VARCHAR(20),
    comment                         TEXT,
    instance_version_at_transition  BIGINT,
    performed_at                    DATETIME(6)  NOT NULL,
    idempotency_key                 VARCHAR(64),
    is_deleted                      TINYINT(1)   NOT NULL DEFAULT 0,
    created_at                      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at                      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by                      BIGINT       NOT NULL DEFAULT 0,
    updated_by                      BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_wt_instance_id   (workflow_instance_id),
    INDEX idx_wt_actor_id      (actor_id),
    INDEX idx_wt_performed_at  (performed_at),
    INDEX idx_wt_action        (action),
    INDEX idx_wt_idempotency   (idempotency_key),
    CONSTRAINT fk_wt_workflow_instance FOREIGN KEY (workflow_instance_id)
        REFERENCES workflow_instances (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Separate idempotency table for the workflow engine
CREATE TABLE IF NOT EXISTS workflow_idempotency_records (
    id                    BIGINT       NOT NULL AUTO_INCREMENT,
    actor_user_id         BIGINT       NOT NULL,
    idempotency_key       VARCHAR(64)  NOT NULL,
    workflow_instance_id  BIGINT       NOT NULL,
    action                VARCHAR(40)  NOT NULL,
    result_status         VARCHAR(20)  NOT NULL,
    result_json           JSON,
    created_at_instant    DATETIME(6)  NOT NULL,
    expires_at            DATETIME(6)  NOT NULL,
    is_deleted            TINYINT(1)   NOT NULL DEFAULT 0,
    created_at            DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at            DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by            BIGINT       NOT NULL DEFAULT 0,
    updated_by            BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_wir_key           (idempotency_key),
    INDEX idx_wir_expires_at        (expires_at),
    INDEX idx_wir_workflow_instance (workflow_instance_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- CLARIFICATION ENGINE
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS clarification_threads (
    id                    BIGINT       NOT NULL AUTO_INCREMENT,
    workflow_instance_id  BIGINT       NOT NULL,
    round_number          INT          NOT NULL,
    status                VARCHAR(20)  NOT NULL,
    requested_by          BIGINT       NOT NULL,
    requested_at          DATETIME(6)  NOT NULL,
    responded_by          BIGINT,
    responded_at          DATETIME(6),
    resolved_by           BIGINT,
    resolved_at           DATETIME(6),
    sla_deadline          DATETIME(6),
    escalation_level      INT          NOT NULL DEFAULT 0,
    is_deleted            TINYINT(1)   NOT NULL DEFAULT 0,
    created_at            DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at            DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by            BIGINT       NOT NULL DEFAULT 0,
    updated_by            BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_ct_instance_round (workflow_instance_id, round_number),
    INDEX idx_ct_status       (status),
    INDEX idx_ct_requested_by (requested_by),
    INDEX idx_ct_sla_deadline (sla_deadline),
    CONSTRAINT fk_ct_workflow_instance FOREIGN KEY (workflow_instance_id)
        REFERENCES workflow_instances (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS clarification_messages (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    thread_id           BIGINT       NOT NULL,
    direction           VARCHAR(15)  NOT NULL,
    author_id           BIGINT       NOT NULL,
    message             TEXT         NOT NULL,
    section_name        VARCHAR(100),
    field_names_json    JSON,
    created_at_instant  DATETIME(6)  NOT NULL,
    is_deleted          TINYINT(1)   NOT NULL DEFAULT 0,
    created_at          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by          BIGINT       NOT NULL DEFAULT 0,
    updated_by          BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_cm_thread_id  (thread_id),
    INDEX idx_cm_author_id  (author_id),
    INDEX idx_cm_created_at (created_at_instant),
    CONSTRAINT fk_cm_thread FOREIGN KEY (thread_id)
        REFERENCES clarification_threads (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS clarification_attachments (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    message_id        BIGINT       NOT NULL,
    file_path         VARCHAR(500) NOT NULL,
    file_name         VARCHAR(255) NOT NULL,
    file_size_bytes   BIGINT,
    content_type      VARCHAR(100),
    is_deleted        TINYINT(1)   NOT NULL DEFAULT 0,
    created_at        DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at        DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by        BIGINT       NOT NULL DEFAULT 0,
    updated_by        BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_ca_message_id (message_id),
    CONSTRAINT fk_ca_message FOREIGN KEY (message_id)
        REFERENCES clarification_messages (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- ENTITY VERSIONS (immutable snapshots)
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

CREATE TABLE IF NOT EXISTS entity_versions (
    id                    BIGINT      NOT NULL AUTO_INCREMENT,
    workflow_instance_id  BIGINT      NOT NULL,
    version_number        INT         NOT NULL,
    status                VARCHAR(20) NOT NULL,
    snapshot_json         JSON        NOT NULL,
    diff_json             JSON,
    created_by_user_id    BIGINT      NOT NULL,
    approved_by_user_id   BIGINT,
    approved_at           DATETIME(6),
    is_deleted            TINYINT(1)  NOT NULL DEFAULT 0,
    created_at            DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at            DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by            BIGINT      NOT NULL DEFAULT 0,
    updated_by            BIGINT      NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_ev_instance_version (workflow_instance_id, version_number),
    INDEX idx_ev_status      (status),
    INDEX idx_ev_approved_by (approved_by_user_id),
    CONSTRAINT fk_ev_workflow_instance FOREIGN KEY (workflow_instance_id)
        REFERENCES workflow_instances (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DECLARATION ASSET DETAIL TABLES (sub-tables of asset_declarations)
-- ============================================================

CREATE TABLE IF NOT EXISTS decl_mov_vehicle (
    id                    BIGINT         AUTO_INCREMENT PRIMARY KEY,
    declaration_id        BIGINT         NOT NULL,
    registration_number   VARCHAR(20),
    make_and_model        VARCHAR(200),
    year_of_purchase      INT,
    usage_purpose         VARCHAR(200),
    vehicle_type          VARCHAR(100),
    current_value         DECIMAL(15,2),
    insurance_valid_till  DATE,
    document_reference    VARCHAR(200),
    is_deleted            TINYINT(1)     NOT NULL DEFAULT 0,
    created_at            DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at            DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by            BIGINT         NOT NULL DEFAULT 0,
    updated_by            BIGINT         NOT NULL DEFAULT 0,
    CONSTRAINT fk_dmv_declaration FOREIGN KEY (declaration_id) REFERENCES asset_declarations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS decl_mov_precious_metal (
    id                    BIGINT         AUTO_INCREMENT PRIMARY KEY,
    declaration_id        BIGINT         NOT NULL,
    item_description      TEXT,
    weight_grams          DECIMAL(10,3),
    purity                VARCHAR(50),
    estimated_value       DECIMAL(15,2),
    item_type             VARCHAR(100),
    acquisition_date      DATE,
    storage_location      VARCHAR(255),
    document_reference    VARCHAR(200),
    is_deleted            TINYINT(1)     NOT NULL DEFAULT 0,
    created_at            DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at            DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by            BIGINT         NOT NULL DEFAULT 0,
    updated_by            BIGINT         NOT NULL DEFAULT 0,
    CONSTRAINT fk_dmpm_declaration FOREIGN KEY (declaration_id) REFERENCES asset_declarations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS decl_mov_financial (
    id                    BIGINT         AUTO_INCREMENT PRIMARY KEY,
    declaration_id        BIGINT         NOT NULL,
    asset_type            VARCHAR(100)   NOT NULL,
    institution_name      VARCHAR(255),
    account_number        VARCHAR(100),
    maturity_date         DATE,
    interest_rate         DECIMAL(5,2),
    current_value         DECIMAL(18,2)  NOT NULL,
    description           TEXT,
    document_reference    VARCHAR(200),
    is_deleted            TINYINT(1)     NOT NULL DEFAULT 0,
    created_at            DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at            DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by            BIGINT         NOT NULL DEFAULT 0,
    updated_by            BIGINT         NOT NULL DEFAULT 0,
    CONSTRAINT fk_dmf_declaration FOREIGN KEY (declaration_id) REFERENCES asset_declarations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS decl_mov_equipment (
    id                    BIGINT         AUTO_INCREMENT PRIMARY KEY,
    declaration_id        BIGINT         NOT NULL,
    description           VARCHAR(255),
    quantity              INT,
    total_value           DECIMAL(15,2),
    equipment_type        VARCHAR(100),
    serial_number         VARCHAR(100),
    year_of_purchase      INT,
    condition_text        VARCHAR(100),
    location              VARCHAR(255),
    unit_value            DECIMAL(15,2),
    document_reference    VARCHAR(200),
    is_deleted            TINYINT(1)     NOT NULL DEFAULT 0,
    created_at            DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at            DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by            BIGINT         NOT NULL DEFAULT 0,
    updated_by            BIGINT         NOT NULL DEFAULT 0,
    CONSTRAINT fk_dme_declaration FOREIGN KEY (declaration_id) REFERENCES asset_declarations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS decl_mov_artifact (
    id                            BIGINT         AUTO_INCREMENT PRIMARY KEY,
    declaration_id                BIGINT         NOT NULL,
    artifact_type                 VARCHAR(100),
    material                      VARCHAR(100),
    age_years                     INT,
    age_or_period                 VARCHAR(100),
    historical_significance       TEXT,
    provenance                    TEXT,
    condition_text                VARCHAR(100),
    museum_grade_classification   VARCHAR(100),
    name                          VARCHAR(255),
    description                   TEXT,
    estimated_value               DECIMAL(15,2),
    storage_location              VARCHAR(255),
    document_reference            VARCHAR(200),
    is_deleted                    TINYINT(1)     NOT NULL DEFAULT 0,
    created_at                    DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at                    DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by                    BIGINT         NOT NULL DEFAULT 0,
    updated_by                    BIGINT         NOT NULL DEFAULT 0,
    CONSTRAINT fk_dma_declaration FOREIGN KEY (declaration_id) REFERENCES asset_declarations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS decl_immov_other (
    id                    BIGINT         AUTO_INCREMENT PRIMARY KEY,
    declaration_id        BIGINT         NOT NULL,
    location              VARCHAR(500),
    area                  DECIMAL(12,4),
    land_type             VARCHAR(100),
    document_reference    VARCHAR(200),
    description           TEXT,
    ownership_type        VARCHAR(50),
    valuation             DECIMAL(15,2),
    is_deleted            TINYINT(1)     NOT NULL DEFAULT 0,
    created_at            DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at            DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by            BIGINT         NOT NULL DEFAULT 0,
    updated_by            BIGINT         NOT NULL DEFAULT 0,
    CONSTRAINT fk_dio_declaration FOREIGN KEY (declaration_id) REFERENCES asset_declarations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS decl_immov_leased (
    id                        BIGINT         AUTO_INCREMENT PRIMARY KEY,
    declaration_id            BIGINT         NOT NULL,
    location                  VARCHAR(500),
    lessee_name               VARCHAR(255),
    lease_start_date          DATE,
    lease_expiry              DATE,
    annual_rent               DECIMAL(15,2),
    monthly_rent              DECIMAL(15,2),
    agreement_document_id     BIGINT,
    property_description      TEXT,
    document_reference        VARCHAR(200),
    is_deleted                TINYINT(1)     NOT NULL DEFAULT 0,
    created_at                DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at                DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by                BIGINT         NOT NULL DEFAULT 0,
    updated_by                BIGINT         NOT NULL DEFAULT 0,
    CONSTRAINT fk_dil_declaration FOREIGN KEY (declaration_id) REFERENCES asset_declarations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS decl_immov_building (
    id                    BIGINT         AUTO_INCREMENT PRIMARY KEY,
    declaration_id        BIGINT         NOT NULL,
    location              VARCHAR(500),
    area_sqft             DECIMAL(12,2),
    year_of_construction  INT,
    structure_type        VARCHAR(100),
    valuation             DECIMAL(15,2),
    building_name         VARCHAR(255),
    usage_purpose         VARCHAR(200),
    condition_text        VARCHAR(100),
    document_reference    VARCHAR(200),
    is_deleted            TINYINT(1)     NOT NULL DEFAULT 0,
    created_at            DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at            DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by            BIGINT         NOT NULL DEFAULT 0,
    updated_by            BIGINT         NOT NULL DEFAULT 0,
    CONSTRAINT fk_dib_declaration FOREIGN KEY (declaration_id) REFERENCES asset_declarations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS decl_immov_agri_land (
    id                    BIGINT         AUTO_INCREMENT PRIMARY KEY,
    declaration_id        BIGINT         NOT NULL,
    survey_number         VARCHAR(100),
    location              VARCHAR(500),
    area_acres            DECIMAL(10,4),
    encumbrance           TEXT,
    market_value          DECIMAL(18,2),
    ownership_type        VARCHAR(50),
    document_reference    VARCHAR(200),
    annual_lease_income   DECIMAL(15,2),
    is_deleted            TINYINT(1)     NOT NULL DEFAULT 0,
    created_at            DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at            DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by            BIGINT         NOT NULL DEFAULT 0,
    updated_by            BIGINT         NOT NULL DEFAULT 0,
    CONSTRAINT fk_dial_declaration FOREIGN KEY (declaration_id) REFERENCES asset_declarations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

