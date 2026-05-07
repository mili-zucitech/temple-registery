-- V79: Add index on workflow_transitions(workflow_instance_id, performed_at)
-- Required for GovernanceStatusResolver queries that scan recent transitions per instance.
-- Without this index, queries degrade to O(n) full-table scans at scale.

ALTER TABLE workflow_transitions
    ADD INDEX idx_wt_instance_performed (workflow_instance_id, performed_at);
