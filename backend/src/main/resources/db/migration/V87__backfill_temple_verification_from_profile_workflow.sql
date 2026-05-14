-- Backfill temple verification projection from canonical temple-profile workflow state.
-- Scope is intentionally narrow:
--   1) Only temples whose latest TEMPLE_PROFILE workflow is APPROVED/RE_APPROVED.
--   2) Only rows currently UNVERIFIED/UNDER_REVIEW.
--   3) Never overrides FLAGGED.

UPDATE temples t
JOIN (
    SELECT ranked.temple_id, ranked.status
    FROM (
        SELECT
            wi.temple_id,
            wi.status,
            ROW_NUMBER() OVER (
                PARTITION BY wi.temple_id
                ORDER BY wi.status_updated_at DESC, wi.id DESC
            ) AS rn
        FROM workflow_instances wi
        WHERE wi.entity_type = 'TEMPLE_PROFILE'
          AND wi.is_deleted = 0
    ) ranked
    WHERE ranked.rn = 1
) latest ON latest.temple_id = t.id
SET
    t.verification_status = 'VERIFIED',
    t.dc_rejection_reason = NULL,
    t.updated_at = NOW(6)
WHERE latest.status IN ('APPROVED', 'RE_APPROVED')
  AND t.verification_status IN ('UNVERIFIED', 'UNDER_REVIEW')
  AND t.is_deleted = 0;
