-- V44: Add acknowledgement fields to in_app_notifications
-- and create notification_action_log table

ALTER TABLE in_app_notifications
    ADD COLUMN requires_acknowledgement BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN acknowledged_at TIMESTAMP NULL,
    ADD COLUMN acknowledged_by BIGINT NULL,
    ADD COLUMN idempotency_key VARCHAR(255) NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ian_idempotency_key
    ON in_app_notifications (idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS notification_action_log (
    id BIGSERIAL PRIMARY KEY,
    notification_id BIGINT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    performed_by BIGINT NOT NULL,
    performed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_nal_notification_id ON notification_action_log (notification_id);
CREATE INDEX IF NOT EXISTS idx_nal_performed_by ON notification_action_log (performed_by);
