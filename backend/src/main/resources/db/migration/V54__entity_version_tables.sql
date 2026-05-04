-- V54: Entity Version Snapshot Tables
-- Implements immutable version snapshots with diff support as per Architecture Blueprint §7
-- Replaces: AssetDeclarationVersion (entity cloning — expensive), TempleProfileStaging SUPERSEDED pattern

-- ─── entity_versions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS entity_versions (
    id                      BIGINT          NOT NULL AUTO_INCREMENT,
    workflow_instance_id    BIGINT          NOT NULL,
    version_number          INT             NOT NULL COMMENT 'V1=initial approval, V2=first edit-after-approval, etc.',
    status                  VARCHAR(20)     NOT NULL COMMENT 'DRAFT_OVERLAY | APPROVED | SUPERSEDED | DISCARDED',
    snapshot_json           JSON            NOT NULL COMMENT 'Full entity state at this version',
    diff_json               JSON            NULL     COMMENT 'Field-level diff vs previous approved version (null for V1)',
    created_by_user_id      BIGINT          NOT NULL,
    approved_by_user_id     BIGINT          NULL,
    approved_at             DATETIME(6)     NULL,
    is_deleted              TINYINT(1)      NOT NULL DEFAULT 0,
    created_at              DATETIME(6)     NOT NULL DEFAULT NOW(6),
    updated_at              DATETIME(6)     NOT NULL DEFAULT NOW(6),
    created_by              BIGINT          NOT NULL DEFAULT 0,
    updated_by              BIGINT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_ev_instance_version (workflow_instance_id, version_number),
    INDEX idx_ev_status (status),
    INDEX idx_ev_approved_by (approved_by_user_id),
    CONSTRAINT fk_ev_workflow_instance FOREIGN KEY (workflow_instance_id)
        REFERENCES workflow_instances (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Immutable entity snapshots enabling version comparison and edit-after-approval diff';
