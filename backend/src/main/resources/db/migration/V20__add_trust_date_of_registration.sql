-- V20: Add date_of_registration column to trust_registrations
-- ─────────────────────────────────────────────────────────────
-- The TrustRegistration JPA entity requires this column.
-- V4 created the table without it; this migration adds and backfills it.

ALTER TABLE trust_registrations
    ADD COLUMN date_of_registration DATE NULL AFTER registered_date;

-- Backfill from registered_date so no rows have NULL after the migration.
UPDATE trust_registrations
SET date_of_registration = registered_date
WHERE date_of_registration IS NULL;
