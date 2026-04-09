-- V1: Users and refresh tokens (auth foundation)
-- ─────────────────────────────────────────────

CREATE TABLE users (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    username       VARCHAR(64)  NOT NULL,
    email          VARCHAR(255) NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    full_name      VARCHAR(128) NOT NULL,
    mobile         VARCHAR(15),
    role           VARCHAR(32)  NOT NULL,
    district_id    BIGINT,
    temple_id      BIGINT,
    mfa_type       VARCHAR(16)  NOT NULL DEFAULT 'NONE',
    mfa_secret     VARCHAR(255),
    is_active      TINYINT(1)   NOT NULL DEFAULT 0,
    aadhaar_verified TINYINT(1) NOT NULL DEFAULT 0,
    failed_login_count INT       NOT NULL DEFAULT 0,
    locked_until   DATETIME,
    last_login_at  DATETIME,
    is_deleted     TINYINT(1)   NOT NULL DEFAULT 0,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by     BIGINT,
    updated_by     BIGINT,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username),
    UNIQUE KEY uq_users_email    (email),
    INDEX idx_users_role         (role),
    INDEX idx_users_district_id  (district_id),
    INDEX idx_users_temple_id    (temple_id),
    INDEX idx_users_is_deleted   (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE refresh_tokens (
    id           BIGINT      NOT NULL AUTO_INCREMENT,
    user_id      BIGINT      NOT NULL,
    token_hash   VARCHAR(64) NOT NULL,
    expires_at   DATETIME    NOT NULL,
    revoked_at   DATETIME,
    created_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_rt_token_hash (token_hash),
    INDEX idx_rt_user_id        (user_id),
    CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
