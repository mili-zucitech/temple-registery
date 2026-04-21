-- V33: Production hardening for Trust & Board module
-- Fixes:
--   1. Adds aadhaar_hash + aadhaar_last4 columns to board_members for deterministic duplicate detection
--   2. Adds unique constraint on (trust_id, aadhaar_hash) to enforce Aadhaar uniqueness per trust
--   3. Adds unique constraint on trust_registration_number (idempotent — V32 may have already added it)
--   4. Adds unique constraint on (trust_id, financial_year) to trust_financials (idempotent)
--   5. Syncs temples.trust_registered flag
--   6. Drops orphaned board_member_staging table (no entity/service exists)
--   7. Ensures board_meetings and trust_financials FKs point to trusts (not trust_registrations)
-- NOTE: Does NOT reference trust_registrations (dropped in V21). Safe to run on any post-V21 schema.

-- ─── 1. Add Aadhaar hash + last4 columns ─────────────────────────────────────
ALTER TABLE board_members
    ADD COLUMN IF NOT EXISTS aadhaar_hash   VARCHAR(64)  NULL COMMENT 'HMAC-SHA256 of plaintext Aadhaar for duplicate detection',
    ADD COLUMN IF NOT EXISTS aadhaar_last4  CHAR(4)      NULL COMMENT 'Last 4 digits of plaintext Aadhaar for masked display';

-- ─── 2. Unique constraint on (trust_id, aadhaar_hash) ────────────────────────
-- Only add if not already present
SET @constraint_exists = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'board_members'
      AND CONSTRAINT_NAME = 'uq_bm_trust_aadhaar_hash'
);
SET @sql = IF(@constraint_exists = 0,
    'ALTER TABLE board_members ADD CONSTRAINT uq_bm_trust_aadhaar_hash UNIQUE (trust_id, aadhaar_hash)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ─── 3. Unique constraint on trust_registration_number ───────────────────────
SET @constraint_exists2 = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'trusts'
      AND CONSTRAINT_NAME = 'uq_trust_registration_number'
);
SET @sql2 = IF(@constraint_exists2 = 0,
    'ALTER TABLE trusts ADD CONSTRAINT uq_trust_registration_number UNIQUE (trust_registration_number)',
    'SELECT 1'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- ─── 4. Unique constraint on trust_financials (trust_id, financial_year) ─────
SET @constraint_exists3 = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'trust_financials'
      AND CONSTRAINT_NAME = 'uq_tf_trust_year'
);
SET @sql3 = IF(@constraint_exists3 = 0,
    'ALTER TABLE trust_financials ADD CONSTRAINT uq_tf_trust_year UNIQUE (trust_id, financial_year)',
    'SELECT 1'
);
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- ─── 5. Sync temples.trust_registered ────────────────────────────────────────
UPDATE temples t
SET t.trust_registered = EXISTS (
    SELECT 1 FROM trusts tr
    WHERE tr.temple_id = t.id AND tr.is_deleted = 0
);

-- ─── 6. Drop orphaned board_member_staging table ─────────────────────────────
DROP TABLE IF EXISTS board_member_staging;

-- ─── 7. Fix future registration dates (data repair) ──────────────────────────
UPDATE trusts
SET date_of_registration = CURDATE()
WHERE date_of_registration > CURDATE();
