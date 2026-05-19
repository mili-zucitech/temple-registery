-- Ensure one active trust financial record per trust + financial year.
-- Step 1: Soft-delete duplicate active rows (keep the oldest id per trust/year).
UPDATE trust_financials tf
JOIN (
    SELECT trust_id, financial_year, MIN(id) AS keep_id
    FROM trust_financials
    WHERE is_deleted = 0
    GROUP BY trust_id, financial_year
    HAVING COUNT(*) > 1
) dups
  ON tf.trust_id = dups.trust_id
 AND tf.financial_year = dups.financial_year
 AND tf.id <> dups.keep_id
SET tf.is_deleted = 1,
    tf.updated_at = NOW(6);

-- Step 2: Add unique key for active rows.
ALTER TABLE trust_financials
    ADD UNIQUE KEY uk_trust_financials_trust_fy_deleted (trust_id, financial_year, is_deleted);
