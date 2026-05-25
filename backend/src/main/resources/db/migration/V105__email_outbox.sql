-- ============================================================================
-- V105: Email Outbox — DB-backed email delivery queue
--
-- Replaces the in-memory LinkedBlockingQueue in EmailDeliveryService which:
--   (a) lost all pending emails on JVM restart
--   (b) silently dropped emails when queue capacity (1000) was reached
--   (c) had no retry capability with full render context
--
-- Architecture:
--   NotificationDispatchServiceImpl → email_outbox (PENDING)
--   EmailDeliveryService.processQueue()   → reads PENDING → sends → SENT | FAILED
--   EmailDeliveryService.processRetries() → reads FAILED w/ backoff → SENT | DEAD_LETTER
--   EmailRetryScheduler.monitorDeadLetterQueue() → alerts on DEAD_LETTER rows
--
-- Exponential back-off schedule (stored in next_retry_at):
--   Attempt 1: immediate | Attempt 2: +1 min | Attempt 3: +5 min
--   Attempt 4: +30 min   | Attempt 5: +2 h   | Attempt 6+: DEAD_LETTER
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_outbox (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Recipient (resolved at enqueue time so retries use the original address)
    recipient_user_id   BIGINT UNSIGNED     NULL     COMMENT 'FK to users.id; null for non-user emails',
    recipient_email     VARCHAR(255)        NOT NULL,
    subject             VARCHAR(500)        NOT NULL,

    -- Template (short key; "email/" prefix added by EmailTemplateResolver at render time)
    template_key        VARCHAR(100)        NOT NULL,

    -- Full Thymeleaf render context — allows retries to render the IDENTICAL email
    context_json        JSON                NOT NULL,

    -- Domain context (for filtering / debugging)
    entity_type         VARCHAR(40)         NULL,
    entity_id           BIGINT UNSIGNED     NULL,

    -- Delivery state machine: PENDING → SENT | FAILED → DEAD_LETTER
    status              VARCHAR(20)         NOT NULL DEFAULT 'PENDING',
    priority            VARCHAR(10)         NOT NULL DEFAULT 'MEDIUM',

    -- Retry control
    retry_count         INT                 NOT NULL DEFAULT 0,
    max_retries         INT                 NOT NULL DEFAULT 5,
    next_retry_at       DATETIME(6)         NULL     COMMENT 'Next eligible retry time (exponential back-off)',
    sent_at             DATETIME(6)         NULL,
    last_failure_reason TEXT                NULL,

    -- Audit
    created_at          DATETIME(6)         NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6)         NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    -- Indexes
    INDEX idx_eo_status_priority_retry (status, priority, next_retry_at),
    INDEX idx_eo_recipient_email       (recipient_email),
    INDEX idx_eo_entity                (entity_type, entity_id),
    INDEX idx_eo_created_at            (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='DB-backed email delivery outbox. Replaces in-memory queue.';
