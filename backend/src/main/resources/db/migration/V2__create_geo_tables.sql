-- V2: Geographic hierarchy (state → city → district → taluk → hobli)
-- ──────────────────────────────────────────────────────────────────

CREATE TABLE states (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    name       VARCHAR(128) NOT NULL,
    code       VARCHAR(3)   NOT NULL,
    is_deleted TINYINT(1)  NOT NULL DEFAULT 0,
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    PRIMARY KEY (id),
    UNIQUE KEY uq_states_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cities (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    state_id   BIGINT       NOT NULL,
    name       VARCHAR(128) NOT NULL,
    is_deleted TINYINT(1)  NOT NULL DEFAULT 0,
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    PRIMARY KEY (id),
    INDEX idx_cities_state_id (state_id),
    CONSTRAINT fk_cities_state FOREIGN KEY (state_id) REFERENCES states (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE districts (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    city_id    BIGINT       NOT NULL,
    name       VARCHAR(128) NOT NULL,
    is_deleted TINYINT(1)  NOT NULL DEFAULT 0,
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    PRIMARY KEY (id),
    INDEX idx_districts_city_id (city_id),
    CONSTRAINT fk_districts_city FOREIGN KEY (city_id) REFERENCES cities (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE taluks (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    district_id BIGINT       NOT NULL,
    name        VARCHAR(128) NOT NULL,
    is_deleted  TINYINT(1)  NOT NULL DEFAULT 0,
    created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by  BIGINT,
    updated_by  BIGINT,
    PRIMARY KEY (id),
    INDEX idx_taluks_district_id (district_id),
    CONSTRAINT fk_taluks_district FOREIGN KEY (district_id) REFERENCES districts (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE hoblis (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    taluk_id   BIGINT       NOT NULL,
    name       VARCHAR(128) NOT NULL,
    is_deleted TINYINT(1)  NOT NULL DEFAULT 0,
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    PRIMARY KEY (id),
    INDEX idx_hoblis_taluk_id (taluk_id),
    CONSTRAINT fk_hoblis_taluk FOREIGN KEY (taluk_id) REFERENCES taluks (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
