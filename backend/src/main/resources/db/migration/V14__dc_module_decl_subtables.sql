-- ============================================================
-- V14: DC Module Pre-Implementation — Asset Declaration Sub-Tables
-- dc_e2e Section 4.8a: the 8 asset item tables and acknowledgement_sequences.
-- Creation order: asset_declarations must exist (created in V7) before sub-tables.
-- ============================================================

-- -------------------------------------------------------------------
-- Immovable asset sub-tables (linked via declaration_id)
-- -------------------------------------------------------------------

CREATE TABLE decl_immov_agri_land (
    id                      BIGINT         NOT NULL AUTO_INCREMENT,
    declaration_id          BIGINT         NOT NULL,
    survey_number           VARCHAR(100)   NULL,
    area_acres              DECIMAL(10,4)  NULL,
    location                VARCHAR(500)   NULL,
    encumbrance             TEXT           NULL,
    annual_lease_income     DECIMAL(15,2)  NULL,
    PRIMARY KEY (id),
    INDEX idx_diag_decl (declaration_id),
    CONSTRAINT fk_diag_decl FOREIGN KEY (declaration_id) REFERENCES asset_declarations (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE decl_immov_building (
    id                      BIGINT         NOT NULL AUTO_INCREMENT,
    declaration_id          BIGINT         NOT NULL,
    structure_type          VARCHAR(100)   NULL,
    area_sqft               DECIMAL(12,2)  NULL,
    condition_text          VARCHAR(100)   NULL,
    valuation               DECIMAL(15,2)  NULL,
    PRIMARY KEY (id),
    INDEX idx_dib_decl (declaration_id),
    CONSTRAINT fk_dib_decl FOREIGN KEY (declaration_id) REFERENCES asset_declarations (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE decl_immov_leased (
    id                      BIGINT         NOT NULL AUTO_INCREMENT,
    declaration_id          BIGINT         NOT NULL,
    lessee_name             VARCHAR(255)   NULL,
    lease_expiry            DATE           NULL,
    annual_rent             DECIMAL(15,2)  NULL,
    PRIMARY KEY (id),
    INDEX idx_dil_decl (declaration_id),
    CONSTRAINT fk_dil_decl FOREIGN KEY (declaration_id) REFERENCES asset_declarations (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE decl_immov_other (
    id                      BIGINT         NOT NULL AUTO_INCREMENT,
    declaration_id          BIGINT         NOT NULL,
    description             TEXT           NULL,
    area                    DECIMAL(12,4)  NULL,
    valuation               DECIMAL(15,2)  NULL,
    PRIMARY KEY (id),
    INDEX idx_dio_decl (declaration_id),
    CONSTRAINT fk_dio_decl FOREIGN KEY (declaration_id) REFERENCES asset_declarations (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------
-- Movable asset sub-tables
-- -------------------------------------------------------------------

CREATE TABLE decl_mov_precious_metal (
    id                      BIGINT         NOT NULL AUTO_INCREMENT,
    declaration_id          BIGINT         NOT NULL,
    item_type               VARCHAR(100)   NULL,
    weight_grams            DECIMAL(10,3)  NULL,
    purity                  VARCHAR(50)    NULL,
    estimated_value         DECIMAL(15,2)  NULL,
    PRIMARY KEY (id),
    INDEX idx_dmpm_decl (declaration_id),
    CONSTRAINT fk_dmpm_decl FOREIGN KEY (declaration_id) REFERENCES asset_declarations (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE decl_mov_artifact (
    id                      BIGINT         NOT NULL AUTO_INCREMENT,
    declaration_id          BIGINT         NOT NULL,
    name                    VARCHAR(255)   NULL,
    description             TEXT           NULL,
    estimated_value         DECIMAL(15,2)  NULL,
    storage_location        VARCHAR(255)   NULL,
    PRIMARY KEY (id),
    INDEX idx_dma_decl (declaration_id),
    CONSTRAINT fk_dma_decl FOREIGN KEY (declaration_id) REFERENCES asset_declarations (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE decl_mov_vehicle (
    id                      BIGINT         NOT NULL AUTO_INCREMENT,
    declaration_id          BIGINT         NOT NULL,
    vehicle_type            VARCHAR(100)   NULL,
    registration_number     VARCHAR(20)    NULL,
    year_of_purchase        INT            NULL,
    current_value           DECIMAL(15,2)  NULL,
    PRIMARY KEY (id),
    INDEX idx_dmv_decl (declaration_id),
    CONSTRAINT fk_dmv_decl FOREIGN KEY (declaration_id) REFERENCES asset_declarations (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE decl_mov_equipment (
    id                      BIGINT         NOT NULL AUTO_INCREMENT,
    declaration_id          BIGINT         NOT NULL,
    description             VARCHAR(255)   NULL,
    quantity                INT            NULL,
    unit_value              DECIMAL(15,2)  NULL,
    total_value             DECIMAL(15,2)  NULL,
    PRIMARY KEY (id),
    INDEX idx_dme_decl (declaration_id),
    CONSTRAINT fk_dme_decl FOREIGN KEY (declaration_id) REFERENCES asset_declarations (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------
-- acknowledgement_sequences: per-financial-year sequential counter
-- dc_e2e Section 2.7 and 4.12a
-- INSERT-only. LAST_INSERT_ID() gives the atomic sequence number.
-- -------------------------------------------------------------------
CREATE TABLE acknowledgement_sequences (
    seq_id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    financial_year  CHAR(7)         NOT NULL COMMENT 'Format YYYY-YY e.g. 2025-26',
    created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (seq_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
