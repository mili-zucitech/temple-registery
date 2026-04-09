-- V7: Asset declarations and clarifications
-- ──────────────────────────────────────────

CREATE TABLE asset_declarations (
    id                           BIGINT        NOT NULL AUTO_INCREMENT,
    temple_id                    BIGINT        NOT NULL,
    district_id                  BIGINT        NOT NULL,
    status                       VARCHAR(32)   NOT NULL DEFAULT 'DRAFT',
    acknowledgement_number       VARCHAR(64),
    -- Immovable assets
    agricultural_land_acres      DECIMAL(10,3),
    agricultural_land_value      DECIMAL(18,2),
    buildings_sqft               DECIMAL(12,2),
    buildings_value              DECIMAL(18,2),
    leased_properties_count      INT,
    leased_properties_value      DECIMAL(18,2),
    other_land_value             DECIMAL(18,2),
    -- Movable assets
    gold_grams                   DECIMAL(10,3),
    silver_grams                 DECIMAL(10,3),
    idols_count                  INT,
    vehicles_count               INT,
    financial_assets_value       DECIMAL(18,2),
    other_movable_value          DECIMAL(18,2),
    -- Workflow timestamps
    due_date                     DATE,
    submitted_at                 DATETIME,
    reviewed_at                  DATETIME,
    reviewed_by                  BIGINT,
    version                      BIGINT        NOT NULL DEFAULT 0,
    is_deleted                   TINYINT(1)    NOT NULL DEFAULT 0,
    created_at                   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by                   BIGINT,
    updated_by                   BIGINT,
    PRIMARY KEY (id),
    INDEX idx_ad_temple_id   (temple_id),
    INDEX idx_ad_district_id (district_id),
    INDEX idx_ad_status      (status),
    INDEX idx_ad_due_date    (due_date),
    CONSTRAINT fk_ad_temple FOREIGN KEY (temple_id) REFERENCES temples (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE declaration_clarifications (
    id             BIGINT    NOT NULL AUTO_INCREMENT,
    declaration_id BIGINT    NOT NULL,
    direction      VARCHAR(16) NOT NULL,
    message        TEXT      NOT NULL,
    author_id      BIGINT    NOT NULL,
    created_at     DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_dc_declaration_id (declaration_id),
    CONSTRAINT fk_dc_declaration FOREIGN KEY (declaration_id) REFERENCES asset_declarations (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
