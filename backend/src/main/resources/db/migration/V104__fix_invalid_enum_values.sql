-- ============================================================================
-- V104: Fix invalid enum values that cause Hibernate to throw IllegalArgumentException
--       → HTTP 500 on any DC endpoint that loads the affected entities.
--
-- Root cause analysis:
--   A) temple_profile_staging.status stores stale legacy status names that no
--      longer match any TempleProfileStagingStatus enum constant:
--        'SUBMITTED'              → PENDING_REVIEW  (enum comment: "PENDING_REVIEW is
--                                                     displayed as SUBMITTED in API")
--        'RE_APPROVED'            → APPROVED        (re-approval = approved state)
--        'UPDATED_AFTER_APPROVAL' → APPROVED        (staging was approved; TA edited it
--                                                     since; canonical approved state preserved)
--
--   B) asset_declarations.physical_verification_status is '' (empty string) for
--      declarations seeded before the column had a NOT NULL DEFAULT 'NOT_INITIATED'.
--      PhysicalVerificationStatus has no blank/null mapping; Hibernate throws on load.
--
-- Both failures are caught by @ExceptionHandler(Exception.class) → INTERNAL_ERROR 500.
-- ============================================================================

-- ── A: Fix TempleProfileStagingStatus values ─────────────────────────────────

UPDATE temple_profile_staging
SET status = 'PENDING_REVIEW',
    updated_at = NOW(6)
WHERE status = 'SUBMITTED'
  AND is_deleted = 0;

UPDATE temple_profile_staging
SET status = 'APPROVED',
    updated_at = NOW(6)
WHERE status IN ('RE_APPROVED', 'UPDATED_AFTER_APPROVAL')
  AND is_deleted = 0;

-- ── B: Fix blank physical_verification_status in asset_declarations ───────────

UPDATE asset_declarations
SET physical_verification_status = 'NOT_INITIATED',
    updated_at = NOW(6)
WHERE physical_verification_status = ''
  AND is_deleted = 0;
