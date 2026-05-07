-- V80: Remove dc_flag_reason from board_members
-- BoardMember.dcFlagReason is no longer used after Phase 3 kills DcCompliance Trust paths.
-- The isVerifiedByDc column is retained (used in approval logic).

ALTER TABLE board_members
    DROP COLUMN dc_flag_reason;
