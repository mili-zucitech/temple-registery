-- V44: Add acknowledgement fields to in_app_notifications
-- and create notification_action_log table

ALTER TABLE in_app_notifications
    ADD COLUMN IF NOT EXISTS requires_acknowledgement BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS acknowledged_by BIGINT NULL,
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255) NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ian_idempotency_key
    ON in_app_notifications (idempotency_key);

CREATE TABLE IF NOT EXISTS notification_action_log (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    notification_id BIGINT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    performed_by BIGINT NOT NULL,
    performed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_nal_notification_id ON notification_action_log (notification_id);
CREATE INDEX IF NOT EXISTS idx_nal_performed_by ON notification_action_log (performed_by);
