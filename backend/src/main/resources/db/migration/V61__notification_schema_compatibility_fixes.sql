-- V61: Notification schema compatibility fixes for MySQL and mixed environments
-- - Ensure notification_action_log exists with MySQL-compatible DDL
-- - Ensure idempotency key index exists on in_app_notifications
-- - Ensure workflow_instance_id and index exist on in_app_notifications
-- - Ensure template_key exists on email_delivery_logs (plural table)
-- - Allow NULL notification_event_id in email_delivery_logs for v2 pipeline compatibility

SET @schema_name = DATABASE();

-- 1) Ensure notification_action_log table exists (MySQL syntax)
SET @notification_action_log_exists := (
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = @schema_name
      AND table_name = 'notification_action_log'
);
SET @sql := IF(
    @notification_action_log_exists = 0,
    'CREATE TABLE notification_action_log (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        notification_id BIGINT UNSIGNED NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        performed_by BIGINT UNSIGNED NOT NULL,
        performed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        notes TEXT,
        PRIMARY KEY (id),
        INDEX idx_nal_notification_id (notification_id),
        INDEX idx_nal_performed_by (performed_by)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Ensure idempotency_key column exists
SET @ian_idempotency_col_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'in_app_notifications'
      AND column_name = 'idempotency_key'
);
SET @sql := IF(
    @ian_idempotency_col_exists = 0,
    'ALTER TABLE in_app_notifications ADD COLUMN idempotency_key VARCHAR(255) NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) Ensure unique index exists on idempotency_key
SET @ian_idempotency_idx_exists := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = @schema_name
      AND table_name = 'in_app_notifications'
      AND index_name = 'idx_ian_idempotency_key'
);
SET @sql := IF(
    @ian_idempotency_idx_exists = 0,
    'CREATE UNIQUE INDEX idx_ian_idempotency_key ON in_app_notifications (idempotency_key)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4) Ensure workflow_instance_id column/index exists on in_app_notifications
SET @ian_wf_col_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'in_app_notifications'
      AND column_name = 'workflow_instance_id'
);
SET @sql := IF(
    @ian_wf_col_exists = 0,
    'ALTER TABLE in_app_notifications ADD COLUMN workflow_instance_id BIGINT NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ian_wf_idx_exists := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = @schema_name
      AND table_name = 'in_app_notifications'
      AND index_name = 'idx_ian_workflow_instance'
);
SET @sql := IF(
    @ian_wf_idx_exists = 0,
    'CREATE INDEX idx_ian_workflow_instance ON in_app_notifications (workflow_instance_id)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5) Ensure template_key exists on email_delivery_logs (plural)
SET @edl_template_key_col_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'email_delivery_logs'
      AND column_name = 'template_key'
);
SET @sql := IF(
    @edl_template_key_col_exists = 0,
    'ALTER TABLE email_delivery_logs ADD COLUMN template_key VARCHAR(100) NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6) Allow NULL notification_event_id to support v2 email path
SET @edl_notification_event_nullable := (
    SELECT CASE WHEN IS_NULLABLE = 'YES' THEN 1 ELSE 0 END
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'email_delivery_logs'
      AND column_name = 'notification_event_id'
);
SET @sql := IF(
    IFNULL(@edl_notification_event_nullable, 1) = 0,
    'ALTER TABLE email_delivery_logs MODIFY COLUMN notification_event_id BIGINT UNSIGNED NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
