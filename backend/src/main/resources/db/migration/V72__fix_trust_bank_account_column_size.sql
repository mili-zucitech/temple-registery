-- V72: Fix trust bank_account_number column to accommodate AES-encrypted values
-- AES-256 encrypted + base64 encoded data can be 200-300 chars; varchar(50) is insufficient.
ALTER TABLE trusts MODIFY COLUMN bank_account_number TEXT;
