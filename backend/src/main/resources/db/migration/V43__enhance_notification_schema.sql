-- V43: Enhance notification schema for Phase 2
-- Add priority, category, and action_url to in_app_notifications
-- Create user_notification_preferences table
-- Create email_delivery_logs table

-- ─── Enhance in_app_notifications table ───────────────────────────────────────
ALTER TABLE in_app_notifications
ADD COLUMN priority VARCHAR(20) DEFAULT 'MEDIUM' AFTER body,
ADD COLUMN category VARCHAR(30) DEFAULT 'SYSTEM' AFTER priority,
ADD COLUMN action_url VARCHAR(255) AFTER category;

-- Add index for better query performance
CREATE INDEX idx_ian_created_at ON in_app_notifications(created_at DESC);
CREATE INDEX idx_ian_priority ON in_app_notifications(priority);
CREATE INDEX idx_ian_category ON in_app_notifications(category);

-- ─── Create user_notification_preferences table ───────────────────────────────
CREATE TABLE user_notification_preferences (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    module_type VARCHAR(30) NOT NULL COMMENT 'TEMPLE, TRUST, EMPLOYEE, CONTRACTOR, DECLARATION, DOCUMENT, SYSTEM',
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    updated_by BIGINT UNSIGNED NOT NULL,
    
    CONSTRAINT fk_unp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_user_module UNIQUE KEY (user_id, module_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User notification preferences per module';

CREATE INDEX idx_unp_user_id ON user_notification_preferences(user_id);

-- ─── Create email_delivery_logs table ─────────────────────────────────────────
CREATE TABLE email_delivery_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    notification_event_id BIGINT UNSIGNED NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL COMMENT 'SENT, FAILED, BOUNCED',
    sent_at DATETIME(6),
    failure_reason VARCHAR(1000),
    retry_count INT DEFAULT 0,
    
    CONSTRAINT fk_edl_notification_event FOREIGN KEY (notification_event_id) 
        REFERENCES notification_events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Email delivery audit log';

CREATE INDEX idx_edl_notification_event ON email_delivery_logs(notification_event_id);
CREATE INDEX idx_edl_recipient_email ON email_delivery_logs(recipient_email);
CREATE INDEX idx_edl_status ON email_delivery_logs(status);
CREATE INDEX idx_edl_sent_at ON email_delivery_logs(sent_at DESC);

-- ─── Insert default preferences for existing users ────────────────────────────
-- All modules enabled by default for all users
INSERT INTO user_notification_preferences (user_id, module_type, in_app_enabled, email_enabled, created_at, updated_at, created_by, updated_by)
SELECT 
    u.id,
    module.type,
    TRUE,
    TRUE,
    NOW(6),
    NOW(6),
    u.id,
    u.id
FROM users u
CROSS JOIN (
    SELECT 'TEMPLE' AS type
    UNION ALL SELECT 'TRUST'
    UNION ALL SELECT 'EMPLOYEE'
    UNION ALL SELECT 'CONTRACTOR'
    UNION ALL SELECT 'DECLARATION'
    UNION ALL SELECT 'DOCUMENT'
    UNION ALL SELECT 'SYSTEM'
) AS module
WHERE u.is_deleted = FALSE
ON DUPLICATE KEY UPDATE updated_at = NOW(6);
