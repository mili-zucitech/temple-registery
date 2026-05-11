-- =============================================================================
-- V89: Performance indexes for temple profile workflow queries
-- =============================================================================
-- The profile staging queries joining workflow_instances by entity_type + temple_id
-- + status are on the hot path (DC dashboard, search summary, verify flow).
-- V52 created idx_wi_temple_status (temple_id, status) on workflow_instances, but
-- adding entity_type to the leading column makes the covering index more selective
-- for all cross-entity queries.
-- =============================================================================

-- Covering index on workflow_instances for the canonical multi-status staging query:
--   WHERE entity_type = 'TEMPLE_PROFILE' AND temple_id = ? AND status IN (?, ?, ?)
--   ORDER BY version_number DESC
-- Supercedes the less-selective idx_wi_temple_status for TEMPLE_PROFILE queries.
ALTER TABLE workflow_instances
    ADD INDEX IF NOT EXISTS idx_wi_entity_type_temple_status
        (entity_type, temple_id, status, version_number);

-- Covering index on temple_profile_staging for sorted, temple-scoped page queries:
--   WHERE temple_id = ? AND version_number = ?
-- Complements idx_profile_staging_temple_status (temple_id, status) already in V13.
ALTER TABLE temple_profile_staging
    ADD INDEX IF NOT EXISTS idx_staging_temple_version
        (temple_id, version_number DESC);
