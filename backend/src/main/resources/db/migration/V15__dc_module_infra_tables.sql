-- ============================================================
-- V15: DC Module Pre-Implementation — Idempotency & Rate Limiting Tables
-- dc_e2e Section 4.12b and 4.12c (on-prem replacements for Redis/Bucket4j).
-- ============================================================

-- -------------------------------------------------------------------
-- idempotency_records: database-backed idempotency cache for workflow mutations.
-- dc_e2e Section 4.12b.
-- Workflow: on first write, INSERT; on duplicate (actor+key), return stored response.
-- Expires after 5 minutes; a cleanup job DELETEs rows WHERE expires_at < NOW().
-- -------------------------------------------------------------------
CREATE TABLE idempotency_records (
    id                  BIGINT         NOT NULL AUTO_INCREMENT,
    actor_user_id       BIGINT         NOT NULL,
    idempotency_key     VARCHAR(255)   NOT NULL COMMENT 'Client-provided X-Idempotency-Key header value',
    response_body       MEDIUMTEXT     NOT NULL COMMENT 'Serialized JSON of first successful response',
    response_status     SMALLINT UNSIGNED NOT NULL COMMENT 'HTTP status code of first response',
    created_at          DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    expires_at          DATETIME(6)    NOT NULL COMMENT 'created_at + 5 minutes; set at INSERT time',

    PRIMARY KEY (id),
    UNIQUE KEY uk_idempotency_actor_key (actor_user_id, idempotency_key),
    INDEX idx_idempotency_lookup  (actor_user_id, idempotency_key),
    INDEX idx_idempotency_expiry  (expires_at),
    CONSTRAINT fk_idempotency_user FOREIGN KEY (actor_user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------
-- rate_request_log: per-user sliding-window rate limit tracker.
-- dc_e2e Section 4.12c — replaces Redis/Bucket4j.
-- Window boundaries are truncated to 10-minute blocks by the service layer.
-- UPSERT pattern: ON DUPLICATE KEY UPDATE request_count = request_count + 1.
-- -------------------------------------------------------------------
CREATE TABLE rate_request_log (
    id                  BIGINT         NOT NULL AUTO_INCREMENT,
    user_id             BIGINT         NOT NULL,
    endpoint_key        VARCHAR(100)   NOT NULL COMMENT 'e.g. export | doc_download | workflow',
    window_start        DATETIME(6)    NOT NULL COMMENT 'Truncated to 10-minute boundary',
    request_count       INT UNSIGNED   NOT NULL DEFAULT 1,
    last_request_at     DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id),
    UNIQUE KEY uk_rrl_user_endpoint_window (user_id, endpoint_key, window_start),
    INDEX idx_rrl_lookup (user_id, endpoint_key, window_start),
    CONSTRAINT fk_rrl_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
