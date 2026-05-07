-- V84: Add is_verified_by_dc to board_members
-- BoardMember.java entity declares this column but it was never added to the table.
-- Default 0 (false) matches the entity's @Builder.Default value.

ALTER TABLE board_members
    ADD COLUMN IF NOT EXISTS is_verified_by_dc TINYINT(1) NOT NULL DEFAULT 0;
