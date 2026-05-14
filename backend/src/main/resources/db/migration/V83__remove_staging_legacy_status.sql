-- V83: Remove legacy status column from temple_profile_staging
-- DEFERRED: Service code (TaDashboardServiceImpl, TempleProfileWorkflowServiceImpl)
-- still reads staging.getStatus() directly. This column cannot be dropped until all
-- callers are migrated to read from WorkflowInstance.status instead.
-- This migration is intentionally a no-op to unblock startup.

SELECT 1;
