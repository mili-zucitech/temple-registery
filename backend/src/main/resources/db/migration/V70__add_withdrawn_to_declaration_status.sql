-- V70: Add WITHDRAWN to asset_declarations.status enum
-- Required by H8: TA declaration withdrawal feature
ALTER TABLE asset_declarations
    MODIFY COLUMN status ENUM(
        'DRAFT',
        'SUBMITTED',
        'UNDER_REVIEW',
        'CLARIFICATION_REQUIRED',
        'CLARIFICATION_RESPONDED',
        'SITE_VISIT_SCHEDULED',
        'SITE_VISIT_COMPLETED',
        'VERIFIED',
        'APPROVED',
        'REJECTED',
        'OVERDUE',
        'SUPERSEDED',
        'WITHDRAWN'
    ) NOT NULL DEFAULT 'DRAFT';
