-- V62: Drop dead governance_version column from asset_declarations and trusts.
--
-- These fields were never incremented in code (always stayed at default 1).
-- Optimistic locking is handled by WorkflowInstance.lock_version (@Version).
-- GovernanceActionHistory.governance_version is retained as an immutable audit snapshot.

ALTER TABLE asset_declarations DROP COLUMN IF EXISTS governance_version;
ALTER TABLE trusts DROP COLUMN IF EXISTS governance_version;
