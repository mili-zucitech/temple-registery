-- V5: Employees
-- ──────────────

CREATE TABLE employees (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    temple_id      BIGINT       NOT NULL,
    full_name      VARCHAR(128) NOT NULL,
    employee_type  VARCHAR(32)  NOT NULL,
    status         VARCHAR(16)  NOT NULL DEFAULT 'ACTIVE',
    designation    VARCHAR(64),
    mobile         VARCHAR(15),
    email          VARCHAR(255),
    joining_date   DATE,
    leaving_date   DATE,
    is_deleted     TINYINT(1)   NOT NULL DEFAULT 0,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by     BIGINT,
    updated_by     BIGINT,
    PRIMARY KEY (id),
    INDEX idx_emp_temple_id (temple_id),
    INDEX idx_emp_status    (status),
    CONSTRAINT fk_emp_temple FOREIGN KEY (temple_id) REFERENCES temples (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
