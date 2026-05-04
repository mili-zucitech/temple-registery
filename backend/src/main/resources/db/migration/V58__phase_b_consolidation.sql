-- V58: Phase B consolidation
-- 1. Add workflow_instance_id to in_app_notifications (for frontend deep-link from bell icon)
-- 2. Add workflowInstanceId index on in_app_notifications
-- 3. Add sendNotification() email tracking column on email_delivery_log

ALTER TABLE in_app_notifications
    ADD COLUMN IF NOT EXISTS workflow_instance_id BIGINT DEFAULT NULL
        COMMENT 'FK to workflow_instances.id — enables frontend deep-link to WorkflowGovernancePanel',
    ADD INDEX IF NOT EXISTS idx_ian_workflow_instance (workflow_instance_id);

-- ─── email_delivery_log: add template_key for v2 pipeline ───────────────────

ALTER TABLE email_delivery_log
    ADD COLUMN IF NOT EXISTS template_key VARCHAR(100) DEFAULT NULL
        COMMENT 'Template key used by EmailService.sendNotification() v2 pipeline';

-- ─── Deprecate legacy governance columns (soft-deprecation — leave data intact) ──────
-- These columns are still read by existing frontend until WorkflowGovernancePanel migration.
-- Remove in V60 after frontend cutover is complete.

-- trust_data: mark submission_status and dc_decision_status as deprecated
-- ALTER TABLE trust_data
--     RENAME COLUMN submission_status TO submission_status_DEPRECATED,
--     RENAME COLUMN dc_decision_status TO dc_decision_status_DEPRECATED;

-- Note: physical uncomment of above lines scheduled for V60 post frontend migration.

-- ─── Add index for workflowInstanceId lookups on trust and declaration ───────

ALTER TABLE trust_data
    ADD INDEX IF NOT EXISTS idx_trust_wf_instance_id (workflow_instance_id);

ALTER TABLE asset_declarations
    ADD INDEX IF NOT EXISTS idx_decl_wf_instance_id (workflow_instance_id);
