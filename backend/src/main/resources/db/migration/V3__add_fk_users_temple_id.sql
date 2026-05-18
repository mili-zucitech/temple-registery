-- V3: Add foreign key constraint from users.temple_id to temples.id
-- Required before temple_id can be reliably used as a FK reference.
-- Uses IF NOT EXISTS guard so re-running is safe.

ALTER TABLE users
    ADD CONSTRAINT fk_users_temple
        FOREIGN KEY (temple_id) REFERENCES temples (id)
        ON DELETE SET NULL;
