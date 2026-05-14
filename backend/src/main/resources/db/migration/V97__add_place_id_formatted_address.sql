-- V97: Add Google Maps place metadata to temple_profile_staging and temple.
ALTER TABLE temple_profile_staging
    ADD COLUMN place_id          VARCHAR(500)    NULL COMMENT 'Google Maps place_id from Places Autocomplete',
    ADD COLUMN formatted_address VARCHAR(1000)   NULL COMMENT 'Human-readable formatted address from Places Autocomplete';

ALTER TABLE temple
    ADD COLUMN place_id          VARCHAR(500)    NULL COMMENT 'Google Maps place_id (promoted from staging on approval)',
    ADD COLUMN formatted_address VARCHAR(1000)   NULL COMMENT 'Human-readable formatted address (promoted on approval)',
    ADD INDEX  idx_temple_place_id (place_id);
