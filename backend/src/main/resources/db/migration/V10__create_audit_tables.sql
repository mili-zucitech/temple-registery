-- V10: Audit trail tables (append-only, no soft-delete)
-- ───────────────────────────────────────────────────────

CREATE TABLE audit_data_events (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    actor_id    BIGINT      NOT NULL,
    actor_role  VARCHAR(32) NOT NULL,
    action      VARCHAR(32) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id   BIGINT      NOT NULL,
    detail      TEXT,
    occurred_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_ade_actor_id (actor_id),
    INDEX idx_ade_entity   (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_auth_events (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    user_id     BIGINT,
    username    VARCHAR(128),
    event_type  VARCHAR(64)  NOT NULL,
    ip_address  VARCHAR(45),
    outcome     VARCHAR(16)  NOT NULL,
    detail      VARCHAR(512),
    occurred_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_aae_user_id    (user_id),
    INDEX idx_aae_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_export_events (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    actor_id        BIGINT       NOT NULL,
    actor_role      VARCHAR(32)  NOT NULL,
    export_type     VARCHAR(32)  NOT NULL,
    filter_summary  TEXT,
    record_count    INT,
    occurred_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_aee_actor_id    (actor_id),
    INDEX idx_aee_export_type (export_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
