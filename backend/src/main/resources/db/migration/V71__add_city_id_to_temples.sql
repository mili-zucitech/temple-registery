-- V71: Add city_id FK to temples table.
-- Rationale: The Temple entity now stores city_id for direct city lookup
-- (previously only district_id was stored; city had to be inferred via join).
-- The old V3 columns (address_line1, address_line2, city VARCHAR, contact_phone)
-- are no longer mapped in the entity and should be dropped to prevent confusion.

ALTER TABLE temples
    ADD COLUMN IF NOT EXISTS city_id BIGINT NULL
        COMMENT 'FK to cities; derived from district at registration time';

ALTER TABLE temples
    ADD CONSTRAINT fk_temples_city
        FOREIGN KEY (city_id) REFERENCES cities(id);

-- Back-fill city_id for existing rows by joining through districts
UPDATE temples t
    JOIN districts d ON d.id = t.district_id
SET t.city_id = d.city_id
WHERE t.city_id IS NULL
  AND t.district_id IS NOT NULL;

-- Drop legacy V3 columns that are no longer mapped in the entity.
-- address_line1 content has already been in the 'street' column via the entity mapping.
-- We only drop if the columns still exist (safe for idempotency).
ALTER TABLE temples
    DROP COLUMN IF EXISTS address_line1,
    DROP COLUMN IF EXISTS address_line2,
    DROP COLUMN IF EXISTS city,
    DROP COLUMN IF EXISTS contact_phone;
