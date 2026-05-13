-- V92: Add aadhaar_number column to users table
-- Super Admin captures this during Temple Authority user creation.

ALTER TABLE users
    ADD COLUMN aadhaar_number VARCHAR(12) NULL
        COMMENT 'Aadhaar number (12 digits); stored for TA users created by Super Admin';

ALTER TABLE users
    ADD INDEX idx_users_aadhaar_number (aadhaar_number);
