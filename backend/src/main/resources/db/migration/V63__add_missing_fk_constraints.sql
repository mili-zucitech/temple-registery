-- V63: Add missing FK constraints for users.district_id, users.temple_id,
--      and temples.district_id.
--
-- These columns existed since V1/V3 with indexes but without FOREIGN KEY
-- constraints, meaning invalid references could be inserted silently.
-- Adding them here enforces referential integrity at the DB level.
--
-- ON DELETE SET NULL: a user/temple must not be deleted just because a
-- district or temple is removed; nullify the reference instead.

ALTER TABLE users
    ADD CONSTRAINT fk_users_district
        FOREIGN KEY (district_id) REFERENCES districts (id)
        ON DELETE SET NULL;

ALTER TABLE users
    ADD CONSTRAINT fk_users_temple
        FOREIGN KEY (temple_id) REFERENCES temples (id)
        ON DELETE SET NULL;

ALTER TABLE temples
    ADD CONSTRAINT fk_temples_district
        FOREIGN KEY (district_id) REFERENCES districts (id)
        ON DELETE RESTRICT;
