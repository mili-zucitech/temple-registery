-- V57: Add lock_version (optimistic locking) to legacy Trust and Declaration tables
-- These columns allow the WorkflowEngineAdaptor to detect concurrent modifications
-- during the Phase A transition period while both legacy and new workflow paths are active.

-- ─── trusts table ───────────────────────────────────────────────────────────

ALTER TABLE trusts
    ADD COLUMN IF NOT EXISTS lock_version BIGINT NOT NULL DEFAULT 0
        COMMENT 'Optimistic locking version for WorkflowEngineAdaptor phase A';

-- ─── asset_declarations table ────────────────────────────────────────────────

ALTER TABLE asset_declarations
    ADD COLUMN IF NOT EXISTS lock_version BIGINT NOT NULL DEFAULT 0
        COMMENT 'Optimistic locking version for WorkflowEngineAdaptor phase A';

-- ─── temple_profile_staging (already added in V52, but ensure idempotent) ──

-- V52 already added lock_version to temple_profile_staging. No-op here.
-- ALTER TABLE temple_profile_staging ADD COLUMN IF NOT EXISTS lock_version BIGINT NOT NULL DEFAULT 0;

-- ─── board_members table ─────────────────────────────────────────────────────

ALTER TABLE board_members
    ADD COLUMN IF NOT EXISTS lock_version BIGINT NOT NULL DEFAULT 0
        COMMENT 'Optimistic locking version for WorkflowEngineAdaptor phase A';

-- ─── Index: workflow_instance_id references on Trust and Declaration ─────────
-- Add nullable FK columns so future Phase B queries can join directly
-- (WorkflowInstance is the owner; these are convenience back-references)

ALTER TABLE trusts
    ADD COLUMN IF NOT EXISTS workflow_instance_id BIGINT DEFAULT NULL
        COMMENT 'FK to workflow_instances.id — populated by V56 backfill + future creates';

ALTER TABLE trusts
    ADD INDEX IF NOT EXISTS idx_trust_workflow_instance (workflow_instance_id);

ALTER TABLE asset_declarations
    ADD COLUMN IF NOT EXISTS workflow_instance_id BIGINT DEFAULT NULL
        COMMENT 'FK to workflow_instances.id — populated by V56 backfill + future creates';

ALTER TABLE asset_declarations
    ADD INDEX IF NOT EXISTS idx_decl_workflow_instance (workflow_instance_id);

-- ─── Backfill workflow_instance_id for existing Trust records ────────────────

UPDATE trusts t
    INNER JOIN workflow_instances wi
        ON wi.entity_type = 'TRUST' AND wi.entity_id = t.id
SET t.workflow_instance_id = wi.id
WHERE t.workflow_instance_id IS NULL;

-- ─── Backfill workflow_instance_id for existing Declaration records ───────────

UPDATE asset_declarations d
    INNER JOIN workflow_instances wi
        ON wi.entity_type = 'DECLARATION' AND wi.entity_id = d.id
SET d.workflow_instance_id = wi.id
WHERE d.workflow_instance_id IS NULL;
