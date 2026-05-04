-- V60: Separate workflow idempotency records into their own table.
--
-- Root cause: V15 created `idempotency_records` with the DC schema (actor_user_id,
-- response_body, response_status). V52 issued CREATE TABLE IF NOT EXISTS for the
-- same name with the workflow schema — it silently no-oped, leaving the table with
-- DC columns only. WorkflowEngineImpl.saveIdempotencyRecord() INSERT always failed
-- with "Unknown column 'workflow_instance_id'" which triggered the runtime guard
-- that disabled idempotency write entirely.
--
-- Fix: give the workflow engine its own table `workflow_idempotency_records`.
-- The existing `idempotency_records` table is kept intact for the DC module.
-- No data migration required — the old table had no workflow rows written to it.

CREATE TABLE IF NOT EXISTS workflow_idempotency_records (
    id                      BIGINT          NOT NULL AUTO_INCREMENT,
    actor_user_id           BIGINT          NOT NULL COMMENT 'User who executed the transition',
    idempotency_key         VARCHAR(64)     NOT NULL COMMENT 'Client-supplied UUID per request',
    workflow_instance_id    BIGINT          NOT NULL COMMENT 'Target workflow_instance.id',
    action                  VARCHAR(40)     NOT NULL COMMENT 'WorkflowAction enum value',
    result_status           VARCHAR(20)     NOT NULL COMMENT 'SUCCESS | FAILED',
    result_json             JSON            NULL     COMMENT 'Serialized WorkflowTransitionResult for replay',
    created_at_instant      DATETIME(6)     NOT NULL COMMENT 'Creation timestamp (Instant)',
    expires_at              DATETIME(6)     NOT NULL COMMENT 'TTL — 24h after creation; cleaned up by scheduler',
    is_deleted              TINYINT(1)      NOT NULL DEFAULT 0,
    created_at              DATETIME(6)     NOT NULL DEFAULT NOW(6),
    updated_at              DATETIME(6)     NOT NULL DEFAULT NOW(6),
    created_by              BIGINT          NOT NULL DEFAULT 0,
    updated_by              BIGINT          NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    UNIQUE KEY uk_wir_key (idempotency_key),
    INDEX idx_wir_expires_at (expires_at),
    INDEX idx_wir_workflow_instance (workflow_instance_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Workflow-engine idempotency cache — prevents duplicate transition execution on client retry';
