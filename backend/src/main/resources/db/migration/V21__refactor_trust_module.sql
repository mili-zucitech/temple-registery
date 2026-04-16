-- V21: Refactor Trust and Board Members module to meet new requirements
-- ────────────────────────────────────────────────────────────────────────
-- Drops old trust_registrations and re-creates as 'trusts' with new schema.
-- Re-creates board_members with new schema.

DROP TABLE IF EXISTS board_members;
DROP TABLE IF EXISTS trust_registrations;

CREATE TABLE trusts (
    id                   BIGINT       NOT NULL AUTO_INCREMENT,
    temple_id            BIGINT       NOT NULL,
    trust_name           VARCHAR(255) NOT NULL,
    registration_number  VARCHAR(100) NOT NULL,
    registration_date    DATE         NOT NULL,
    pan_number           VARCHAR(10)  NOT NULL,
    address_line1        VARCHAR(255) NOT NULL,
    address_line2        VARCHAR(255),
    pincode              VARCHAR(6)   NOT NULL,
    status               ENUM('ACTIVE', 'DISSOLVED') NOT NULL DEFAULT 'ACTIVE',
    dissolution_date     DATE,
    dissolution_reason   TEXT,
    is_deleted           TINYINT(1)   NOT NULL DEFAULT 0,
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by           BIGINT       NOT NULL,
    updated_by           BIGINT       NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_trust_temple_id (temple_id),
    INDEX idx_trust_reg_num (registration_number),
    CONSTRAINT fk_trust_temple FOREIGN KEY (temple_id) REFERENCES temples (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE board_members (
    id                   BIGINT       NOT NULL AUTO_INCREMENT,
    trust_id             BIGINT       NOT NULL,
    name                 VARCHAR(200) NOT NULL,
    designation          VARCHAR(150) NOT NULL,
    phone                VARCHAR(15)  NOT NULL,
    email                VARCHAR(100),
    date_of_joining      DATE         NOT NULL,
    cessation_date       DATE,
    is_current           TINYINT(1)   NOT NULL DEFAULT 1,
    is_deleted           TINYINT(1)   NOT NULL DEFAULT 0,
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by           BIGINT       NOT NULL,
    updated_by           BIGINT       NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_bm_trust_id (trust_id),
    CONSTRAINT fk_bm_trust_new FOREIGN KEY (trust_id) REFERENCES trusts (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
