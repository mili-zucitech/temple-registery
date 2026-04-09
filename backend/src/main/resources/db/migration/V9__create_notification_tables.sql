-- V9: Notification events and in-app inbox
-- ──────────────────────────────────────────

CREATE TABLE notification_events (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    recipient_id    BIGINT      NOT NULL,
    event_type      VARCHAR(64) NOT NULL,
    reference_id    BIGINT,
    reference_type  VARCHAR(32),
    channel         VARCHAR(16) NOT NULL,
    status          VARCHAR(16) NOT NULL,
    failure_reason  VARCHAR(512),
    dispatched_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_ne_recipient_id (recipient_id),
    INDEX idx_ne_event_type   (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE in_app_notifications (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    user_id        BIGINT       NOT NULL,
    title          VARCHAR(255) NOT NULL,
    body           TEXT         NOT NULL,
    reference_id   BIGINT,
    reference_type VARCHAR(32),
    is_read        TINYINT(1)   NOT NULL DEFAULT 0,
    read_at        DATETIME,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_ian_user_id_read (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
