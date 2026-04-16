-- V23: Board Member Staging Table for Approval Workflow
-- -----------------------------------------------------
-- Implements DRAFT → SUBMITTED → APPROVED → REJECTED workflow for board members

CREATE TABLE board_member_staging (
    id                   BIGINT       NOT NULL AUTO_INCREMENT,
    trust_id             BIGINT       NOT NULL,
    name                 VARCHAR(200) NOT NULL,
    aadhaar_encrypted    TEXT,
    designation          VARCHAR(150) NOT NULL,
    appointment_date     DATE         NOT NULL,
    tenure_end_date      DATE,
    contact_number       VARCHAR(15),
    address              TEXT,
    status               ENUM('DRAFT','SUBMITTED','APPROVED','REJECTED') NOT NULL DEFAULT 'DRAFT',
    is_deleted           TINYINT(1)   NOT NULL DEFAULT 0,
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by           BIGINT       NOT NULL,
    updated_by           BIGINT       NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_bms_trust_id (trust_id),
    CONSTRAINT fk_bms_trust FOREIGN KEY (trust_id) REFERENCES trusts (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
