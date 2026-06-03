-- ============================================================
-- V107: Notice Board System
-- Creates notices, notice_attachments, and notice_reads tables.
-- ============================================================

CREATE TABLE notices (
    id            BIGINT         NOT NULL AUTO_INCREMENT,
    title         VARCHAR(255)   NOT NULL,
    body          TEXT           NOT NULL,
    scope         VARCHAR(20)    NOT NULL,            -- DISTRICT | GLOBAL
    district_id   BIGINT         NULL,                -- NULL when scope = GLOBAL
    status        VARCHAR(20)    NOT NULL DEFAULT 'PUBLISHED',
    priority      VARCHAR(10)    NOT NULL DEFAULT 'MEDIUM',
    is_pinned     TINYINT(1)     NOT NULL DEFAULT 0,
    expiry_date   DATE           NULL,
    published_at  DATETIME(6)    NULL,
    version       BIGINT         NOT NULL DEFAULT 0,
    is_deleted    TINYINT(1)     NOT NULL DEFAULT 0,
    created_at    DATETIME(6)    NOT NULL,
    updated_at    DATETIME(6)    NOT NULL,
    created_by    BIGINT         NOT NULL,
    updated_by    BIGINT         NULL,
    PRIMARY KEY (id),
    CONSTRAINT chk_notice_scope CHECK (
        (scope = 'GLOBAL'   AND district_id IS NULL)
        OR (scope = 'DISTRICT' AND district_id IS NOT NULL)
    )
);

CREATE INDEX idx_notices_district_status  ON notices (district_id, status, is_deleted);
CREATE INDEX idx_notices_scope_status     ON notices (scope, status, is_deleted);
CREATE INDEX idx_notices_created_by       ON notices (created_by);
CREATE INDEX idx_notices_expiry           ON notices (expiry_date, status);
CREATE INDEX idx_notices_pinned_status    ON notices (is_pinned, status, is_deleted);

-- ────────────────────────────────────────────────────────────

CREATE TABLE notice_attachments (
    id                BIGINT         NOT NULL AUTO_INCREMENT,
    notice_id         BIGINT         NOT NULL,
    original_filename VARCHAR(512)   NOT NULL,
    stored_key        VARCHAR(1024)  NOT NULL,
    file_size_bytes   BIGINT         NOT NULL,
    mime_type         VARCHAR(128)   NOT NULL,
    is_deleted        TINYINT(1)     NOT NULL DEFAULT 0,
    created_at        DATETIME(6)    NOT NULL,
    updated_at        DATETIME(6)    NOT NULL,
    created_by        BIGINT         NOT NULL,
    updated_by        BIGINT         NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_notice_attachment FOREIGN KEY (notice_id) REFERENCES notices (id)
);

CREATE INDEX idx_notice_attachments_notice ON notice_attachments (notice_id, is_deleted);

-- ────────────────────────────────────────────────────────────

CREATE TABLE notice_reads (
    id        BIGINT      NOT NULL AUTO_INCREMENT,
    notice_id BIGINT      NOT NULL,
    user_id   BIGINT      NOT NULL,
    read_at   DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_notice_user (notice_id, user_id),
    CONSTRAINT fk_notice_reads_notice FOREIGN KEY (notice_id) REFERENCES notices (id)
);

CREATE INDEX idx_notice_reads_user ON notice_reads (user_id);
