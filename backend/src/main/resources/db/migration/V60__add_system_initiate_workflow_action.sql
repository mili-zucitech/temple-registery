-- V60: Add SYSTEM_INITIATE to workflow_transitions.action enum
-- This action is written by WorkflowEngineImpl.initiate() to record the NULL→DRAFT
-- transition in the audit trail. It is a system-internal action, never user-facing.
--
-- Also adds SYSTEM_INITIATE to workflow_instances.action if that column exists
-- (it does not — only workflow_transitions.action needs updating).
--
-- Safe to re-run: MySQL ALTER TABLE ... MODIFY COLUMN is idempotent for enum additions.

ALTER TABLE workflow_transitions
    MODIFY COLUMN action ENUM(
        'APPROVE',
        'AUTO_SUPERSEDE',
        'BEGIN_REVIEW',
        'COMPLETE_SITE_VISIT',
        'EDIT_APPROVED',
        'ESCALATE',
        'EXPIRE_DEADLINE',
        'FAIL_SITE_VISIT',
        'FLAG_OVERDUE',
        'REJECT',
        'REQUEST_CLARIFICATION',
        'RESPOND_CLARIFICATION',
        'RESUBMIT',
        'RE_APPROVE',
        'SCHEDULE_SITE_VISIT',
        'SEND_BACK',
        'SUBMIT',
        'SYSTEM_INITIATE',
        'VERIFY_SITE_VISIT',
        'WARN_DEADLINE_APPROACHING',
        'WITHDRAW'
    ) NOT NULL;
