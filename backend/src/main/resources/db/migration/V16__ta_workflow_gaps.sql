-- ============================================================
-- V16: TA Module Workflow Gap Closure
-- Adds: temples.status (suspension support), employees.date_of_leaving,
--       board_meetings table.
-- Note: temple_profile_staging already exists (V13).
-- Note: employees.status is VARCHAR so RESIGNED needs no schema change.
-- ============================================================

-- -------------------------------------------------------------------
-- Temple suspension support (EC-03, EC-12)
-- Added as a nullable-safe column with ACTIVE default so existing rows
-- are unaffected.
-- -------------------------------------------------------------------
ALTER TABLE temples
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        COMMENT 'TempleStatus: ACTIVE | SUSPENDED';

ALTER TABLE temples
    ADD INDEX idx_temples_status (status);

-- -------------------------------------------------------------------
-- Employee date_of_leaving — required by VAL-015 when transitioning
-- to RESIGNED or RETIRED. Column name follows entity convention
-- (date_of_joining) not the V5 legacy column name (joining_date).
-- -------------------------------------------------------------------
ALTER TABLE employees
    ADD COLUMN date_of_leaving DATE NULL
        COMMENT 'Required when status transitions to RETIRED or RESIGNED (VAL-015)';

-- -------------------------------------------------------------------
-- Board meetings — Step 4.4: upload meeting minutes PDF
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS board_meetings (
    id                  BIGINT        NOT NULL AUTO_INCREMENT,
    trust_id            BIGINT        NOT NULL,
    meeting_date        DATE          NOT NULL,
    agenda              TEXT          NULL,
    minutes_document_id BIGINT        NULL COMMENT 'FK to documents.id; set after upload',
    is_deleted          TINYINT(1)    NOT NULL DEFAULT 0,
    created_at          DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                            ON UPDATE CURRENT_TIMESTAMP(6),
    created_by          BIGINT        NULL,
    updated_by          BIGINT        NULL,

    PRIMARY KEY (id),
    INDEX idx_board_meetings_trust_id (trust_id),
    CONSTRAINT fk_board_meetings_trust
        FOREIGN KEY (trust_id) REFERENCES trust_registrations (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
