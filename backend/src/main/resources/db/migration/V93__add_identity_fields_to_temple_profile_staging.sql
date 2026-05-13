-- V93: Add temple identity fields to temple_profile_staging so the TA can propose
-- changes to these fields through the profile staging workflow (DC must approve).
-- On approval, TempleProfileWorkflowServiceImpl#promoteToTemple() writes them to Temple.
ALTER TABLE temple_profile_staging
    ADD COLUMN alias_name      VARCHAR(255)    NULL COMMENT 'Proposed alias / local name',
    ADD COLUMN primary_deity   VARCHAR(150)    NULL COMMENT 'Proposed primary deity name',
    ADD COLUMN grade           CHAR(1)         NULL COMMENT 'Proposed temple grade: A, B or C',
    ADD COLUMN tradition       VARCHAR(50)     NULL COMMENT 'Proposed religious tradition enum value',
    ADD COLUMN hobli_id        BIGINT          NULL COMMENT 'Proposed hobli (geo hierarchy FK)',
    ADD COLUMN address_line1   VARCHAR(255)    NULL COMMENT 'Proposed street / address line 1',
    ADD COLUMN pin_code        VARCHAR(6)      NULL COMMENT 'Proposed 6-digit PIN code',
    ADD COLUMN latitude        DECIMAL(10,7)   NULL COMMENT 'Proposed GPS latitude',
    ADD COLUMN longitude       DECIMAL(10,7)   NULL COMMENT 'Proposed GPS longitude',
    ADD COLUMN year_established SMALLINT       NULL COMMENT 'Proposed year the temple was established';
