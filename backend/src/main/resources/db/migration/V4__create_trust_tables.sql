-- V4: Trust registrations, board members, financials
-- ────────────────────────────────────────────────────

CREATE TABLE trust_registrations (
    id                   BIGINT       NOT NULL AUTO_INCREMENT,
    temple_id            BIGINT       NOT NULL,
    trust_type           VARCHAR(32)  NOT NULL,
    trust_name           VARCHAR(255) NOT NULL,
    registration_number  VARCHAR(64),
    registered_date      DATE,
    pan_encrypted        TEXT,
    bank_account_encrypted TEXT,
    bank_ifsc            VARCHAR(11),
    bank_name            VARCHAR(128),
    version              BIGINT       NOT NULL DEFAULT 0,
    is_deleted           TINYINT(1)   NOT NULL DEFAULT 0,
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by           BIGINT,
    updated_by           BIGINT,
    PRIMARY KEY (id),
    INDEX idx_tr_temple_id (temple_id),
    CONSTRAINT fk_tr_temple FOREIGN KEY (temple_id) REFERENCES temples (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE board_members (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    trust_id         BIGINT       NOT NULL,
    full_name        VARCHAR(200) NOT NULL,
    aadhaar_encrypted TEXT,
    designation      VARCHAR(150),
    appointment_date DATE,
    tenure_end_date  DATE,
    contact_number   VARCHAR(15),
    address          TEXT,
    is_current       TINYINT(1)   NOT NULL DEFAULT 1,
    is_deleted       TINYINT(1)   NOT NULL DEFAULT 0,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by       BIGINT,
    updated_by       BIGINT,
    PRIMARY KEY (id),
    INDEX idx_bm_trust_id (trust_id),
    CONSTRAINT fk_bm_trust FOREIGN KEY (trust_id) REFERENCES trust_registrations (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE trust_financials (
    id               BIGINT         NOT NULL AUTO_INCREMENT,
    trust_id         BIGINT         NOT NULL,
    financial_year   VARCHAR(9)     NOT NULL,
    total_income     DECIMAL(18,2),
    total_expenditure DECIMAL(18,2),
    surplus_deficit  DECIMAL(18,2),
    auditor_name     VARCHAR(128),
    audit_date       DATE,
    remarks          TEXT,
    is_deleted       TINYINT(1)     NOT NULL DEFAULT 0,
    created_at       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by       BIGINT,
    updated_by       BIGINT,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tf_trust_year (trust_id, financial_year),
    CONSTRAINT fk_tf_trust FOREIGN KEY (trust_id) REFERENCES trust_registrations (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
