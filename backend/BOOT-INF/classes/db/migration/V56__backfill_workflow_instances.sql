-- V56: Backfill workflow_instances from existing entity status fields
-- Safe: INSERT ... ON DUPLICATE KEY UPDATE so re-running is idempotent
-- Maps current status values to canonical WorkflowStatus enum

-- ─── Temple Profile Staging → TEMPLE_PROFILE ──────────────────────────────────
INSERT INTO workflow_instances
    (entity_type, entity_id, status, sub_status, lock_version, version_number,
     current_actor_role, created_by_user_id, temple_id, district_id,
     submitted_at, status_updated_at, created_at, updated_at, created_by, updated_by)
SELECT
    'TEMPLE_PROFILE'                                                AS entity_type,
    tps.id                                                          AS entity_id,
    CASE tps.status
        WHEN 'DRAFT'            THEN 'DRAFT'
        WHEN 'PENDING_REVIEW'   THEN 'SUBMITTED'
        WHEN 'APPROVED'         THEN 'APPROVED'
        WHEN 'REJECTED'         THEN 'REJECTED'
        WHEN 'SUPERSEDED'       THEN 'SUPERSEDED'
        ELSE                         'DRAFT'
    END                                                             AS status,
    NULL                                                            AS sub_status,
    0                                                               AS lock_version,
    COALESCE(tps.version, 1)                                 AS version_number,
    CASE tps.status
        WHEN 'PENDING_REVIEW'   THEN 'DC'
        WHEN 'DRAFT'            THEN 'TA'
        ELSE NULL
    END                                                             AS current_actor_role,
    COALESCE(tps.submitted_by, tps.created_by, 0)                  AS created_by_user_id,
    tps.temple_id                                                   AS temple_id,
    COALESCE(t.district_id, 0)                                      AS district_id,
    tps.submitted_at                                                AS submitted_at,
    tps.updated_at                                                  AS status_updated_at,
    NOW(6), NOW(6), 0, 0
FROM temple_profile_staging tps
LEFT JOIN temples t ON t.id = tps.temple_id
WHERE tps.is_deleted = 0
ON DUPLICATE KEY UPDATE
    status             = VALUES(status),
    sub_status         = VALUES(sub_status),
    current_actor_role = VALUES(current_actor_role),
    updated_at         = NOW(6);


-- ─── Asset Declarations → DECLARATION ─────────────────────────────────────────
INSERT INTO workflow_instances
    (entity_type, entity_id, status, sub_status, lock_version, version_number,
     current_actor_role, created_by_user_id, temple_id, district_id,
     submitted_at, status_updated_at, created_at, updated_at, created_by, updated_by)
SELECT
    'DECLARATION'                                                   AS entity_type,
    ad.id                                                           AS entity_id,
    CASE ad.status
        WHEN 'DRAFT'                    THEN 'DRAFT'
        WHEN 'PENDING_REVIEW'           THEN 'SUBMITTED'
        WHEN 'UNDER_REVIEW'             THEN 'UNDER_REVIEW'
        WHEN 'CLARIFICATION_REQUESTED'  THEN 'CLARIFICATION_REQUESTED'
        WHEN 'CLARIFICATION_RESPONDED'  THEN 'CLARIFICATION_RESPONDED'
        WHEN 'APPROVED'                 THEN 'APPROVED'
        WHEN 'REJECTED'                 THEN 'REJECTED'
        WHEN 'RESUBMITTED'              THEN 'RESUBMITTED'
        WHEN 'SITE_VISIT_SCHEDULED'     THEN 'UNDER_REVIEW'
        WHEN 'SITE_VISIT_COMPLETED'     THEN 'UNDER_REVIEW'
        WHEN 'VERIFIED'                 THEN 'UNDER_REVIEW'
        WHEN 'OVERDUE'                  THEN 'OVERDUE'
        ELSE                                 'DRAFT'
    END                                                             AS status,
    CASE ad.status
        WHEN 'SITE_VISIT_SCHEDULED'     THEN 'SITE_VISIT_SCHEDULED'
        WHEN 'SITE_VISIT_COMPLETED'     THEN 'SITE_VISIT_COMPLETED'
        WHEN 'VERIFIED'                 THEN 'PHYSICALLY_VERIFIED'
        ELSE NULL
    END                                                             AS sub_status,
    0                                                               AS lock_version,
    COALESCE(ad.version_number, 1)                                  AS version_number,
    CASE ad.status
        WHEN 'DRAFT'                    THEN 'TA'
        WHEN 'PENDING_REVIEW'           THEN 'DC'
        WHEN 'UNDER_REVIEW'             THEN 'DC'
        WHEN 'CLARIFICATION_REQUESTED'  THEN 'TA'
        WHEN 'CLARIFICATION_RESPONDED'  THEN 'DC'
        ELSE NULL
    END                                                             AS current_actor_role,
    COALESCE(ad.submitted_by, ad.created_by, 0)                    AS created_by_user_id,
    ad.temple_id,
    ad.district_id,
    ad.submitted_at                                                 AS submitted_at,
    ad.updated_at                                                   AS status_updated_at,
    NOW(6), NOW(6), 0, 0
FROM asset_declarations ad
WHERE ad.is_deleted = 0
ON DUPLICATE KEY UPDATE
    status             = VALUES(status),
    sub_status         = VALUES(sub_status),
    current_actor_role = VALUES(current_actor_role),
    updated_at         = NOW(6);


-- ─── Trusts → TRUST ───────────────────────────────────────────────────────────
INSERT INTO workflow_instances
    (entity_type, entity_id, status, sub_status, lock_version, version_number,
     current_actor_role, created_by_user_id, temple_id, district_id,
     submitted_at, status_updated_at, created_at, updated_at, created_by, updated_by)
SELECT
    'TRUST'                                                         AS entity_type,
    tr.id                                                           AS entity_id,
    CASE tr.submission_status
        WHEN 'DRAFT'        THEN 'DRAFT'
        WHEN 'SUBMITTED'    THEN 'SUBMITTED'
        WHEN 'SENT_BACK'    THEN 'CLARIFICATION_REQUESTED'
        WHEN 'APPROVED'     THEN 'APPROVED'
        WHEN 'REJECTED'     THEN 'REJECTED'
        ELSE                     'DRAFT'
    END                                                             AS status,
    NULL                                                            AS sub_status,
    0                                                               AS lock_version,
    1                                                               AS version_number,
    CASE tr.submission_status
        WHEN 'DRAFT'        THEN 'TA'
        WHEN 'SUBMITTED'    THEN 'DC'
        WHEN 'SENT_BACK'    THEN 'TA'
        ELSE NULL
    END                                                             AS current_actor_role,
    COALESCE(tr.created_by, 0)                                     AS created_by_user_id,
    tr.temple_id,
    COALESCE(t.district_id, 0)                                     AS district_id,
    NULL                                                            AS submitted_at,
    tr.updated_at                                                   AS status_updated_at,
    NOW(6), NOW(6), 0, 0
FROM trusts tr
LEFT JOIN temples t ON t.id = tr.temple_id
WHERE tr.is_deleted = 0
ON DUPLICATE KEY UPDATE
    status             = VALUES(status),
    sub_status         = VALUES(sub_status),
    current_actor_role = VALUES(current_actor_role),
    updated_at         = NOW(6);


-- ─── Board Members → BOARD_MEMBER ─────────────────────────────────────────────
INSERT INTO workflow_instances
    (entity_type, entity_id, status, sub_status, lock_version, version_number,
     current_actor_role, created_by_user_id, temple_id, district_id,
     submitted_at, status_updated_at, created_at, updated_at, created_by, updated_by)
SELECT
    'BOARD_MEMBER'                                                  AS entity_type,
    bm.id                                                           AS entity_id,
    'SUBMITTED'                                                     AS status,
    NULL                                                            AS sub_status,
    0                                                               AS lock_version,
    1                                                               AS version_number,
    'DC'                                                            AS current_actor_role,
    COALESCE(bm.created_by, 0)                                     AS created_by_user_id,
    tr.temple_id,
    COALESCE(t.district_id, 0)                                     AS district_id,
    NULL                                                            AS submitted_at,
    bm.updated_at                                                   AS status_updated_at,
    NOW(6), NOW(6), 0, 0
FROM board_members bm
JOIN trusts tr ON tr.id = bm.trust_id
LEFT JOIN temples t ON t.id = tr.temple_id
WHERE bm.is_deleted = 0
ON DUPLICATE KEY UPDATE
    status             = VALUES(status),
    current_actor_role = VALUES(current_actor_role),
    updated_at         = NOW(6);
