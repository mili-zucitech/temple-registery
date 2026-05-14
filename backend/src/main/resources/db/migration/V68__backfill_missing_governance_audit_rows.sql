-- V68: Backfill governance_action_history rows for auditable workflow_transitions
-- that were created before the WorkflowEngineImpl.execute() -> logWorkflowTransition() call
-- was established. Safe to run multiple times: INSERT IGNORE + unique index on
-- workflow_transition_id prevents duplicates.
--
-- Excluded: SYSTEM_* actions (SYSTEM_INITIATE, SYSTEM_VERSION, etc.) which are
-- internal engine transitions and intentionally have no audit row.

INSERT IGNORE INTO governance_action_history
    (entity_id, entity_type, workflow_instance_id, workflow_transition_id,
     dc_user_id, action, comment, actor_role)
SELECT
    wi.entity_id,
    wi.entity_type                              AS entity_type,
    wi.id                                       AS workflow_instance_id,
    wt.id                                       AS workflow_transition_id,
    COALESCE(wt.actor_id, 0)                    AS dc_user_id,
    wt.action                                   AS action,
    wt.comment                                  AS comment,
    wt.actor_role                               AS actor_role
FROM workflow_transitions wt
JOIN workflow_instances wi ON wi.id = wt.workflow_instance_id
LEFT JOIN governance_action_history gah ON gah.workflow_transition_id = wt.id
WHERE wt.action NOT LIKE 'SYSTEM_%'
  AND gah.id IS NULL;
