-- V53: Unified Clarification Engine Tables
-- Implements the canonical clarification model as per Architecture Blueprint §4
-- Replaces: DeclarationClarification table, Trust.send_back_reason string field

-- ─── clarification_threads ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clarification_threads (
    id                      BIGINT          NOT NULL AUTO_INCREMENT,
    workflow_instance_id    BIGINT          NOT NULL,
    round_number            INT             NOT NULL COMMENT 'Round 1, 2, 3... per workflow instance',
    status                  VARCHAR(20)     NOT NULL COMMENT 'OPEN | RESPONDED | RESOLVED | EXPIRED | ESCALATED',
    requested_by            BIGINT          NOT NULL COMMENT 'DC user who opened this clarification round',
    requested_at            DATETIME(6)     NOT NULL,
    responded_by            BIGINT          NULL     COMMENT 'TA user who responded',
    responded_at            DATETIME(6)     NULL,
    resolved_by             BIGINT          NULL     COMMENT 'DC user who resolved/accepted the response',
    resolved_at             DATETIME(6)     NULL,
    sla_deadline            DATETIME(6)     NULL     COMMENT 'TA must respond by this time',
    escalation_level        INT             NOT NULL DEFAULT 0 COMMENT '0 = normal, 1 = escalated to SUPER_ADMIN',
    is_deleted              TINYINT(1)      NOT NULL DEFAULT 0,
    created_at              DATETIME(6)     NOT NULL DEFAULT NOW(6),
    updated_at              DATETIME(6)     NOT NULL DEFAULT NOW(6),
    created_by              BIGINT          NOT NULL DEFAULT 0,
    updated_by              BIGINT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_ct_instance_round (workflow_instance_id, round_number),
    INDEX idx_ct_status (status),
    INDEX idx_ct_requested_by (requested_by),
    INDEX idx_ct_sla_deadline (sla_deadline),
    CONSTRAINT fk_ct_workflow_instance FOREIGN KEY (workflow_instance_id)
        REFERENCES workflow_instances (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Unified clarification thread — one per round per workflow instance';


-- ─── clarification_messages ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clarification_messages (
    id                      BIGINT          NOT NULL AUTO_INCREMENT,
    thread_id               BIGINT          NOT NULL,
    direction               VARCHAR(15)     NOT NULL COMMENT 'DC_TO_TA | TA_TO_DC',
    author_id               BIGINT          NOT NULL,
    message                 TEXT            NOT NULL,
    section_name            VARCHAR(100)    NULL     COMMENT 'Optional: which section of the form this targets',
    field_names_json        JSON            NULL     COMMENT 'Optional: specific field names e.g. ["trustName","regNumber"]',
    created_at_instant      DATETIME(6)     NOT NULL,
    is_deleted              TINYINT(1)      NOT NULL DEFAULT 0,
    created_at              DATETIME(6)     NOT NULL DEFAULT NOW(6),
    updated_at              DATETIME(6)     NOT NULL DEFAULT NOW(6),
    created_by              BIGINT          NOT NULL DEFAULT 0,
    updated_by              BIGINT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_cm_thread_id (thread_id),
    INDEX idx_cm_author_id (author_id),
    INDEX idx_cm_created_at (created_at_instant),
    CONSTRAINT fk_cm_thread FOREIGN KEY (thread_id)
        REFERENCES clarification_threads (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Bidirectional clarification messages within a thread';


-- ─── clarification_attachments ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clarification_attachments (
    id                      BIGINT          NOT NULL AUTO_INCREMENT,
    message_id              BIGINT          NOT NULL,
    file_path               VARCHAR(500)    NOT NULL,
    file_name               VARCHAR(255)    NOT NULL,
    file_size_bytes         BIGINT          NULL,
    content_type            VARCHAR(100)    NULL,
    is_deleted              TINYINT(1)      NOT NULL DEFAULT 0,
    created_at              DATETIME(6)     NOT NULL DEFAULT NOW(6),
    updated_at              DATETIME(6)     NOT NULL DEFAULT NOW(6),
    created_by              BIGINT          NOT NULL DEFAULT 0,
    updated_by              BIGINT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_ca_message_id (message_id),
    CONSTRAINT fk_ca_message FOREIGN KEY (message_id)
        REFERENCES clarification_messages (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='File attachments on clarification messages (TA evidence uploads)';


-- ─── Data migration: Trust.send_back_reason → clarification_threads ───────────
-- Note: This is a best-effort migration for trusts that have a send_back_reason
-- and are currently in SUBMITTED or SENT_BACK status.
-- Full backfill runs via V57 after workflow_instances are populated.

-- Mark old column deprecated (keep data, stop writing)
-- ALTER TABLE trusts RENAME COLUMN send_back_reason TO send_back_reason_deprecated;
-- (Deferred to Phase 4 cleanup — V58)
