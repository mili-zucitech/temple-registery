-- Align governance_action_history with workflow_transitions for 1:1 append checks.
ALTER TABLE governance_action_history
    ADD COLUMN IF NOT EXISTS workflow_instance_id BIGINT NULL,
    ADD COLUMN IF NOT EXISTS workflow_transition_id BIGINT NULL;

CREATE INDEX IF NOT EXISTS idx_gah_workflow_instance
    ON governance_action_history (workflow_instance_id);

CREATE UNIQUE INDEX IF NOT EXISTS uk_gah_workflow_transition
    ON governance_action_history (workflow_transition_id);
