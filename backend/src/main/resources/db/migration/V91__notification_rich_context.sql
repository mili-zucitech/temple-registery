-- V91: Enrich in_app_notifications with workflow-aware context fields.
--
-- Adds:
--   notification_type  — canonical event type (TEMPLE_PROFILE_APPROVED, TRUST_REJECTED, …)
--   temple_id          — owning temple (for deep-link routing)
--   temple_name        — denormalised name so no JOIN is needed when serving the inbox
--   action_by_name     — full name of the user who triggered the event
--   action_by_role     — role of the triggering user (TA / DC / ADMIN)
--   redirect_url       — computed deep-link the frontend should navigate to on click
--   deleted_at         — soft-delete timestamp (NULL = visible)
--   workflow_status    — WorkflowStatus after the transition (APPROVED, REJECTED, …)
--
-- All columns are nullable so existing rows are unaffected.

ALTER TABLE in_app_notifications
    ADD COLUMN notification_type VARCHAR(50)  NULL AFTER category,
    ADD COLUMN temple_id         BIGINT        NULL AFTER reference_type,
    ADD COLUMN temple_name       VARCHAR(255)  NULL,
    ADD COLUMN action_by_name    VARCHAR(255)  NULL,
    ADD COLUMN action_by_role    VARCHAR(50)   NULL,
    ADD COLUMN redirect_url      VARCHAR(512)  NULL AFTER action_url,
    ADD COLUMN deleted_at        DATETIME      NULL AFTER acknowledged_by,
    ADD COLUMN workflow_status   VARCHAR(50)   NULL;

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_ian_temple_id     ON in_app_notifications (temple_id);
CREATE INDEX IF NOT EXISTS idx_ian_deleted_at    ON in_app_notifications (deleted_at);
