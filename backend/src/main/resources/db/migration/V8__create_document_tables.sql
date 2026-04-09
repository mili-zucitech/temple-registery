-- V8: Documents and access logs
-- ───────────────────────────────

CREATE TABLE documents (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    owner_type        VARCHAR(32)  NOT NULL,
    owner_id          BIGINT       NOT NULL,
    reference_id      BIGINT,
    original_filename VARCHAR(255) NOT NULL,
    s3_key            VARCHAR(512) NOT NULL,
    mime_type         VARCHAR(128) NOT NULL,
    file_size_bytes   BIGINT       NOT NULL,
    document_label    VARCHAR(128),
    is_deleted        TINYINT(1)   NOT NULL DEFAULT 0,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by        BIGINT,
    updated_by        BIGINT,
    PRIMARY KEY (id),
    INDEX idx_doc_owner        (owner_type, owner_id),
    INDEX idx_doc_reference_id (reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE document_access_logs (
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    document_id   BIGINT      NOT NULL,
    accessor_id   BIGINT      NOT NULL,
    accessor_role VARCHAR(32) NOT NULL,
    access_type   VARCHAR(16) NOT NULL,
    accessed_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_da_doc_id      (document_id),
    INDEX idx_da_accessor_id (accessor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
