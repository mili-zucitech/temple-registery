-- V4: Add designation and access_type columns to users table.
-- access_type controls whether a TEMPLE_AUTHORITY user can edit (EDIT) or only view (VIEW).
-- Existing users default to EDIT so no behaviour changes for current users.

ALTER TABLE users
    ADD COLUMN designation  VARCHAR(150) NULL        AFTER temple_id,
    ADD COLUMN access_type  VARCHAR(10)  NOT NULL DEFAULT 'EDIT' AFTER designation;
