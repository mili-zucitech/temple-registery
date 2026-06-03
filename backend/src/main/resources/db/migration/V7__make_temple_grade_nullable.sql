-- V97 was absorbed by Flyway repair (history record updated but SQL never executed).
-- This migration actually applies the ALTER TABLE that V97 intended.
ALTER TABLE temples MODIFY COLUMN grade VARCHAR(5) NULL;
