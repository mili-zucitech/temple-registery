-- V57: Add lock_version (optimistic locking) to Trust and Declaration tables
-- These columns allow the WorkflowEngineAdaptor to detect concurrent modifications
-- during the Phase A transition period while both legacy and new workflow paths are active.
--
-- CORRECTION: 'trust_data' is an obsolete/phantom name — it was never created.
-- V21 (domain refactor) renamed trust_registrations → trusts. All trust_data
-- references below are replaced with 'trusts', which is the canonical table.
-- Every block uses the INFORMATION_SCHEMA existence check (same pattern as V51)
-- so this migration is safe on both fresh and existing databases.

-- ─── Resolve table existence flags ──────────────────────────────────────────

SET @tbl_trusts = (
    SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trusts'
);

SET @tbl_decl = (
    SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'asset_declarations'
);

SET @tbl_bm = (
    SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'board_members'
);

SET @tbl_wi = (
    SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'workflow_instances'
);

-- ─── trusts: lock_version ────────────────────────────────────────────────────

SET @sql = IF(@tbl_trusts > 0,
    'ALTER TABLE trusts ADD COLUMN IF NOT EXISTS lock_version BIGINT NOT NULL DEFAULT 0 COMMENT ''Optimistic locking version for WorkflowEngineAdaptor phase A''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ─── asset_declarations: lock_version ────────────────────────────────────────

SET @sql = IF(@tbl_decl > 0,
    'ALTER TABLE asset_declarations ADD COLUMN IF NOT EXISTS lock_version BIGINT NOT NULL DEFAULT 0 COMMENT ''Optimistic locking version for WorkflowEngineAdaptor phase A''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ─── temple_profile_staging (already added in V52, but ensure idempotent) ──

-- V52 already added lock_version to temple_profile_staging. No-op here.
-- ALTER TABLE temple_profile_staging ADD COLUMN IF NOT EXISTS lock_version BIGINT NOT NULL DEFAULT 0;

-- ─── board_members: lock_version ─────────────────────────────────────────────

SET @sql = IF(@tbl_bm > 0,
    'ALTER TABLE board_members ADD COLUMN IF NOT EXISTS lock_version BIGINT NOT NULL DEFAULT 0 COMMENT ''Optimistic locking version for WorkflowEngineAdaptor phase A''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ─── trusts: workflow_instance_id back-reference column ──────────────────────
-- (WorkflowInstance is the owner; this is a convenience back-reference)

SET @sql = IF(@tbl_trusts > 0,
    'ALTER TABLE trusts ADD COLUMN IF NOT EXISTS workflow_instance_id BIGINT DEFAULT NULL COMMENT ''FK to workflow_instances.id — populated by V56 backfill + future creates''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(@tbl_trusts > 0,
    'ALTER TABLE trusts ADD INDEX IF NOT EXISTS idx_trusts_workflow_instance (workflow_instance_id)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ─── asset_declarations: workflow_instance_id back-reference column ──────────

SET @sql = IF(@tbl_decl > 0,
    'ALTER TABLE asset_declarations ADD COLUMN IF NOT EXISTS workflow_instance_id BIGINT DEFAULT NULL COMMENT ''FK to workflow_instances.id — populated by V56 backfill + future creates''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(@tbl_decl > 0,
    'ALTER TABLE asset_declarations ADD INDEX IF NOT EXISTS idx_decl_workflow_instance (workflow_instance_id)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ─── Backfill workflow_instance_id for existing Trust records ────────────────

SET @sql = IF(@tbl_trusts > 0 AND @tbl_wi > 0,
    'UPDATE trusts t INNER JOIN workflow_instances wi ON wi.entity_type = ''TRUST'' AND wi.entity_id = t.id SET t.workflow_instance_id = wi.id WHERE t.workflow_instance_id IS NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ─── Backfill workflow_instance_id for existing Declaration records ───────────

SET @sql = IF(@tbl_decl > 0 AND @tbl_wi > 0,
    'UPDATE asset_declarations d INNER JOIN workflow_instances wi ON wi.entity_type = ''DECLARATION'' AND wi.entity_id = d.id SET d.workflow_instance_id = wi.id WHERE d.workflow_instance_id IS NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
