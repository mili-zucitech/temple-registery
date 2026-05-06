-- V71: Create observations table for AUDITOR compliance observations
--
-- Idempotency note: same as V70 — a previous failed attempt may leave an empty
-- table with corrupt/duplicate index metadata. DROP IF EXISTS is safe because
-- the table is only populated after a complete successful migration run.
-- All indexes are inlined in CREATE TABLE to avoid separate CREATE INDEX steps.

DROP TABLE IF EXISTS observations;

CREATE TABLE observations (
    id                      BIGINT      NOT NULL AUTO_INCREMENT,
    temple_id               BIGINT      NOT NULL,
    entity_type             VARCHAR(40) NOT NULL,
    entity_id               BIGINT      NOT NULL,
    title                   VARCHAR(255) NOT NULL,
    description             TEXT        NOT NULL,
    severity                VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status                  VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    raised_by_user_id       BIGINT      NOT NULL,
    assigned_to_user_id     BIGINT,
    evidence_document_ids   JSON,
    resolution_note         TEXT,
    closed_at               DATETIME,
    is_deleted              TINYINT(1)  NOT NULL DEFAULT 0,
    created_at              DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by              BIGINT      NOT NULL DEFAULT 0,
    updated_by              BIGINT      NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_obs_temple_id (temple_id),
    INDEX idx_obs_status    (status),
    INDEX idx_obs_severity  (severity),
    INDEX idx_obs_raised_by (raised_by_user_id),
    INDEX idx_obs_entity    (entity_type, entity_id),
    CONSTRAINT fk_obs_temple FOREIGN KEY (temple_id) REFERENCES temples(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
