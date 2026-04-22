-- V37: Rename contractor company_name to name for consistency
-- ─────────────────────────────────────────────────────────────

ALTER TABLE contractors 
CHANGE COLUMN company_name name VARCHAR(255) NOT NULL;
