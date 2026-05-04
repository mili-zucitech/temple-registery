-- V52: Workflow Engine Core Tables
-- Implements the canonical governance workflow engine as per Architecture Blueprint §2
-- Replaces: Trust.submissionStatus, AssetDeclaration.status, TempleProfileStagingStatus, BoardMember.isVerifiedByDc

-- ─── workflow_instances ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_instances (
    id                      BIGINT          NOT NULL AUTO_INCREMENT,
    entity_type             VARCHAR(30)     NOT NULL COMMENT 'TEMPLE_PROFILE | DECLARATION | TRUST | BOARD_MEMBER',
    entity_id               BIGINT          NOT NULL COMMENT 'FK to domain entity (no FK constraint — cross-aggregate link)',
    status                  VARCHAR(40)     NOT NULL COMMENT 'Canonical WorkflowStatus enum value',
    sub_status              VARCHAR(50)     NULL     COMMENT 'Module-specific sub-state within parent status',
    lock_version            BIGINT          NOT NULL DEFAULT 0 COMMENT 'JPA @Version optimistic lock',
    version_number          INT             NOT NULL DEFAULT 1 COMMENT 'Business version counter (increments on edit-after-approval)',
    current_actor_role      VARCHAR(20)     NULL     COMMENT 'TA | DC | SYSTEM — who is expected to act next',
    created_by_user_id      BIGINT          NOT NULL COMMENT 'User who created the entity',
    temple_id               BIGINT          NOT NULL COMMENT 'Ownership scoping',
    district_id             BIGINT          NOT NULL COMMENT 'Jurisdiction scoping',
    deadline_at             DATETIME(6)     NULL     COMMENT 'SLA deadline — null = no deadline',
    submitted_at            DATETIME(6)     NULL     COMMENT 'When entity was last submitted',
    status_updated_at       DATETIME(6)     NULL     COMMENT 'When status field was last changed',
    metadata_json           JSON            NULL     COMMENT 'Module-specific metadata (e.g., financialYear)',
    is_deleted              TINYINT(1)      NOT NULL DEFAULT 0,
    created_at              DATETIME(6)     NOT NULL DEFAULT NOW(6),
    updated_at              DATETIME(6)     NOT NULL DEFAULT NOW(6),
    created_by              BIGINT          NOT NULL DEFAULT 0,
    updated_by              BIGINT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_wi_entity (entity_type, entity_id),
    INDEX idx_wi_status (status),
    INDEX idx_wi_district_status (district_id, status),
    INDEX idx_wi_temple_status (temple_id, status),
    INDEX idx_wi_created_by (created_by_user_id),
    INDEX idx_wi_status_updated (status_updated_at),
    INDEX idx_wi_deadline (deadline_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Single source of truth for workflow state across all governable entities';


-- ─── workflow_transitions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_transitions (
    id                              BIGINT          NOT NULL AUTO_INCREMENT,
    workflow_instance_id            BIGINT          NOT NULL,
    from_status                     VARCHAR(40)     NULL     COMMENT 'NULL for initial DRAFT creation',
    to_status                       VARCHAR(40)     NOT NULL,
    from_sub_status                 VARCHAR(50)     NULL,
    to_sub_status                   VARCHAR(50)     NULL,
    action                          VARCHAR(40)     NOT NULL COMMENT 'WorkflowAction enum value',
    actor_id                        BIGINT          NOT NULL,
    actor_role                      VARCHAR(20)     NULL     COMMENT 'TA | DC | SYSTEM | SUPER_ADMIN',
    comment                         TEXT            NULL,
    instance_version_at_transition  BIGINT          NULL     COMMENT 'lock_version at time of transition (before increment)',
    performed_at                    DATETIME(6)     NOT NULL,
    idempotency_key                 VARCHAR(64)     NULL,
    is_deleted                      TINYINT(1)      NOT NULL DEFAULT 0,
    created_at                      DATETIME(6)     NOT NULL DEFAULT NOW(6),
    updated_at                      DATETIME(6)     NOT NULL DEFAULT NOW(6),
    created_by                      BIGINT          NOT NULL DEFAULT 0,
    updated_by                      BIGINT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_wt_instance_id (workflow_instance_id),
    INDEX idx_wt_actor_id (actor_id),
    INDEX idx_wt_performed_at (performed_at),
    INDEX idx_wt_action (action),
    CONSTRAINT fk_wt_workflow_instance FOREIGN KEY (workflow_instance_id)
        REFERENCES workflow_instances (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Immutable audit log of every workflow state transition';


-- ─── idempotency_records ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS idempotency_records (
    id                      BIGINT          NOT NULL AUTO_INCREMENT,
    idempotency_key         VARCHAR(64)     NOT NULL,
    workflow_instance_id    BIGINT          NOT NULL,
    action                  VARCHAR(40)     NOT NULL,
    result_status           VARCHAR(20)     NULL     COMMENT 'SUCCESS | FAILED',
    result_json             JSON            NULL     COMMENT 'Cached WorkflowTransitionResult for replay',
    created_at_instant      DATETIME(6)     NOT NULL,
    expires_at              DATETIME(6)     NOT NULL COMMENT 'Cleanup after this time',
    is_deleted              TINYINT(1)      NOT NULL DEFAULT 0,
    created_at              DATETIME(6)     NOT NULL DEFAULT NOW(6),
    updated_at              DATETIME(6)     NOT NULL DEFAULT NOW(6),
    created_by              BIGINT          NOT NULL DEFAULT 0,
    updated_by              BIGINT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_ir_key (idempotency_key),
    INDEX idx_ir_expires_at (expires_at),
    INDEX idx_ir_workflow_instance (workflow_instance_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Idempotency cache for workflow commands — prevents duplicate execution on retry';


-- ─── Add @Version column to temple_profile_staging (was missing) ──────────────
ALTER TABLE temple_profile_staging
    ADD COLUMN IF NOT EXISTS lock_version BIGINT NOT NULL DEFAULT 0
        COMMENT 'JPA @Version optimistic lock — was missing, causing silent concurrent approval overwrites';
