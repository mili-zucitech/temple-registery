-- V86: Simplify Trust and Temple Profile workflow
-- Remove clarification loop. Map:
--   CLARIFICATION_REQUESTED  → REJECTED        (DC had flagged it — treat as rejection)
--   CLARIFICATION_RESPONDED  → RESUBMITTED     (TA responded — treat as resubmission)
-- Declaration workflow is UNCHANGED.

-- Backfill workflow_instances for TRUST
UPDATE workflow_instances
SET    status = 'REJECTED',
       sub_status = NULL,
       current_actor_role = 'TA',
       status_updated_at = NOW()
WHERE  entity_type = 'TRUST'
  AND  status = 'CLARIFICATION_REQUESTED';

UPDATE workflow_instances
SET    status = 'RESUBMITTED',
       sub_status = NULL,
       current_actor_role = 'DC',
       status_updated_at = NOW()
WHERE  entity_type = 'TRUST'
  AND  status = 'CLARIFICATION_RESPONDED';

-- Backfill workflow_instances for TEMPLE_PROFILE
UPDATE workflow_instances
SET    status = 'REJECTED',
       sub_status = NULL,
       current_actor_role = 'TA',
       status_updated_at = NOW()
WHERE  entity_type = 'TEMPLE_PROFILE'
  AND  status IN ('CLARIFICATION_REQUESTED', 'OVERDUE')
  AND  sub_status IN ('FLAGGED', 'FLAG_OVERDUE');

UPDATE workflow_instances
SET    status = 'RESUBMITTED',
       sub_status = NULL,
       current_actor_role = 'DC',
       status_updated_at = NOW()
WHERE  entity_type = 'TEMPLE_PROFILE'
  AND  status = 'CLARIFICATION_RESPONDED';

-- Fix any TRUST declarations whose legacy declaration.status was set to DRAFT
-- after a successful WorkflowInstance transition to SUBMITTED.
-- This ensures DC listing queries (which filter status != 'DRAFT') can see them.
UPDATE asset_declarations d
INNER JOIN workflow_instances wi
    ON  wi.entity_type = 'DECLARATION'
    AND wi.entity_id   = d.id
SET d.status = 'SUBMITTED',
    d.updated_at = NOW()
WHERE d.status = 'DRAFT'
  AND wi.status = 'SUBMITTED'
  AND d.is_deleted = 0;
