-- V90: Formalise temple_photos table in Flyway
-- Previously auto-created by Hibernate ddl-auto=update only.
-- temple_photos is the CANONICAL source for gallery images.
-- Gallery images are NOT stored in temple_profile_staging or temple_profile_current.

CREATE TABLE IF NOT EXISTS temple_photos (
    id                BIGINT          NOT NULL AUTO_INCREMENT,
    temple_id         BIGINT          NOT NULL,
    file_path         VARCHAR(500)    NOT NULL,
    original_filename VARCHAR(255),
    width             INT,
    height            INT,
    is_primary        TINYINT(1)      NOT NULL DEFAULT 0,
    display_order     INT,
    is_deleted        TINYINT(1)      NOT NULL DEFAULT 0,
    version           BIGINT          NOT NULL DEFAULT 0,
    created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by        BIGINT,
    updated_by        BIGINT,
    PRIMARY KEY (id),
    INDEX idx_temple_photos_temple_id   (temple_id),
    INDEX idx_temple_photos_is_deleted  (is_deleted),
    CONSTRAINT fk_temple_photos_temple FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clean up any stale presigned URL prefixes that may have been stored in file_path
-- (These were introduced by a bug where presignedUrl() result was stored instead of raw path)
UPDATE temple_photos
SET file_path = SUBSTRING_INDEX(file_path, 'key=', -1)
WHERE file_path LIKE '%/api/v1/documents/download?key=%'
  AND file_path IS NOT NULL
  AND file_path != '';
