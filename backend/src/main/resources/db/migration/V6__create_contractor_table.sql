-- V6: Contractors
-- ─────────────────

CREATE TABLE contractors (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    temple_id           BIGINT        NOT NULL,
    company_name        VARCHAR(255)  NOT NULL,
    gst_number          VARCHAR(15),
    service_type        VARCHAR(128),
    contract_reference  VARCHAR(64),
    work_order_date     DATE,
    contract_start_date DATE,
    contract_end_date   DATE,
    contract_value      DECIMAL(18,2),
    payment_status      VARCHAR(32),
    document_id         BIGINT,
    is_deleted          TINYINT(1)    NOT NULL DEFAULT 0,
    created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by          BIGINT,
    updated_by          BIGINT,
    PRIMARY KEY (id),
    INDEX idx_con_temple_id (temple_id),
    CONSTRAINT fk_con_temple FOREIGN KEY (temple_id) REFERENCES temples (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
