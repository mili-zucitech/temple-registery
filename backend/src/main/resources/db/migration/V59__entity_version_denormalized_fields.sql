-- V59: Add denormalized fields to entity_versions for VersionService (Phase B)
-- These columns enable direct querying without joining through workflow_instances.

ALTER TABLE entity_versions
    ADD COLUMN IF NOT EXISTS entity_type  VARCHAR(30) DEFAULT NULL
        COMMENT 'Denormalized from workflow_instances.entity_type',
    ADD COLUMN IF NOT EXISTS entity_id    BIGINT DEFAULT NULL
        COMMENT 'Denormalized from workflow_instances.entity_id',
    ADD COLUMN IF NOT EXISTS captured_at  DATETIME(6) DEFAULT NULL
        COMMENT 'When VersionService captured this snapshot',
    ADD COLUMN IF NOT EXISTS captured_by_user_id BIGINT DEFAULT NULL
        COMMENT 'User who triggered the snapshot',
    ADD COLUMN IF NOT EXISTS triggering_transition_id BIGINT DEFAULT NULL
        COMMENT 'FK to workflow_transitions.id that caused this snapshot';

-- Index for entity-scoped queries (most common access pattern)
ALTER TABLE entity_versions
    ADD INDEX IF NOT EXISTS idx_ev_entity (entity_type, entity_id),
    ADD INDEX IF NOT EXISTS idx_ev_entity_version (entity_type, entity_id, version_number);

-- Backfill entity_type and entity_id from linked workflow_instances
UPDATE entity_versions ev
    INNER JOIN workflow_instances wi ON ev.workflow_instance_id = wi.id
SET ev.entity_type = wi.entity_type,
    ev.entity_id   = wi.entity_id
WHERE ev.entity_type IS NULL;
