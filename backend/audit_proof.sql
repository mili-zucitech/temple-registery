-- =============================================
-- PROOF 1: AUDIT CONSISTENCY
-- =============================================

SELECT 'P1_TOTAL_AUDITABLE' AS probe, COUNT(*) AS value
FROM workflow_transitions
WHERE action NOT LIKE 'SYSTEM_%';

SELECT 'P1_TOTAL_GAH_LINKED' AS probe, COUNT(*) AS value
FROM governance_action_history
WHERE workflow_transition_id IS NOT NULL;

SELECT 'P1_MISSING_AUDIT' AS probe, COUNT(*) AS value
FROM workflow_transitions wt
LEFT JOIN governance_action_history gah ON gah.workflow_transition_id = wt.id
WHERE wt.action NOT LIKE 'SYSTEM_%'
  AND gah.id IS NULL;

SELECT 'P1_EXTRA_GAH' AS probe, COUNT(*) AS value
FROM governance_action_history gah
LEFT JOIN workflow_transitions wt ON wt.id = gah.workflow_transition_id
WHERE wt.id IS NULL
  AND gah.workflow_transition_id IS NOT NULL;

SELECT 'P1_ACTION_MISMATCH' AS probe, COUNT(*) AS value
FROM workflow_transitions wt
JOIN governance_action_history gah ON gah.workflow_transition_id = wt.id
WHERE UPPER(wt.action) != UPPER(gah.action)
  AND wt.action NOT LIKE 'SYSTEM_%';

-- Sample missing rows
SELECT 'SAMPLE_MISSING_TRANSITIONS' AS section,
       wt.id, wt.workflow_instance_id, wt.action, wt.from_status, wt.to_status,
       DATE_FORMAT(wt.performed_at, '%Y-%m-%d %H:%i:%s') AS performed_at
FROM workflow_transitions wt
LEFT JOIN governance_action_history gah ON gah.workflow_transition_id = wt.id
WHERE wt.action NOT LIKE 'SYSTEM_%'
  AND gah.id IS NULL
ORDER BY wt.id DESC
LIMIT 5;

-- Sample extra GAH rows
SELECT 'SAMPLE_EXTRA_GAH' AS section,
       gah.id, gah.workflow_instance_id, gah.workflow_transition_id, gah.action,
       DATE_FORMAT(gah.timestamp, '%Y-%m-%d %H:%i:%s') AS ts
FROM governance_action_history gah
LEFT JOIN workflow_transitions wt ON wt.id = gah.workflow_transition_id
WHERE wt.id IS NULL
  AND gah.workflow_transition_id IS NOT NULL
ORDER BY gah.id DESC
LIMIT 5;

-- =============================================
-- PROOF 2: CLEANUP RESIDUE
-- =============================================

-- Since no test_run_id column exists in production tables,
-- check for test-pattern data using financial_year pattern (tests use 1xxx-xx years)
SELECT 'P2_RESIDUE_ASSET_DECL_TEST_YEARS' AS probe, COUNT(*) AS value
FROM asset_declarations
WHERE financial_year REGEXP '^[1-9][0-9]{3}-[0-9]{2}$'
  AND CAST(SUBSTRING_INDEX(financial_year, '-', 1) AS UNSIGNED) < 2000;

SELECT 'P2_RESIDUE_ASSET_DECL_RECENT_24H' AS probe, COUNT(*) AS value
FROM asset_declarations
WHERE created_at >= NOW() - INTERVAL 24 HOUR
  AND financial_year REGEXP '^[1-9][0-9]{3}-[0-9]{2}$'
  AND CAST(SUBSTRING_INDEX(financial_year, '-', 1) AS UNSIGNED) < 2000;

SELECT 'P2_TEMPLES_RECENT_24H' AS probe, COUNT(*) AS value
FROM temples
WHERE created_at >= NOW() - INTERVAL 24 HOUR;

SELECT 'P2_TRUSTS_RECENT_24H' AS probe, COUNT(*) AS value
FROM trusts
WHERE created_at >= NOW() - INTERVAL 24 HOUR;

SELECT 'P2_WORKFLOW_INSTANCES_RECENT_24H' AS probe, COUNT(*) AS value
FROM workflow_instances
WHERE created_at >= NOW() - INTERVAL 24 HOUR;

SELECT 'P2_NOTIF_OUTBOX_RECENT_24H' AS probe, COUNT(*) AS value
FROM notification_outbox
WHERE created_at >= NOW() - INTERVAL 24 HOUR;

SELECT 'P2_IN_APP_NOTIF_RECENT_24H' AS probe, COUNT(*) AS value
FROM in_app_notifications
WHERE created_at >= NOW() - INTERVAL 24 HOUR;
