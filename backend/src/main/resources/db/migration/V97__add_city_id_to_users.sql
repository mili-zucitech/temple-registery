-- V97: Add city_id column to users table for DC/DC_STAFF/TEMPLE_AUTHORITY geo assignment
ALTER TABLE users
    ADD COLUMN city_id BIGINT NULL AFTER district_id;
