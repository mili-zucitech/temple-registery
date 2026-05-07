-- V85: Restore asset_declarations.status column dropped prematurely by V82.
-- Service code (DeclarationServiceImpl, GovernanceWorkflowServiceImpl, etc.)
-- still reads AssetDeclaration.getStatus() directly and cannot be migrated
-- to WorkflowInstance.status without significant service-layer refactoring.
--
-- Strategy:
--  1. Re-add the column with DEFAULT 'DRAFT'.
--  2. Backfill from workflow_instances where workflow_instance_id is populated.
--  3. Restore the two indexes dropped by V82.

ALTER TABLE asset_declarations
    ADD COLUMN IF NOT EXISTS status VARCHAR(40) NOT NULL DEFAULT 'DRAFT';

-- Backfill status from the linked WorkflowInstance (V57 populated workflow_instance_id).
UPDATE asset_declarations d
    INNER JOIN workflow_instances wi ON wi.id = d.workflow_instance_id
SET d.status = wi.status
WHERE d.workflow_instance_id IS NOT NULL;

-- Restore single-column index used by DC dashboard queries.
CREATE INDEX IF NOT EXISTS idx_decl_status ON asset_declarations (status);

-- Restore composite index used by overdue-dashboard queries.
CREATE INDEX IF NOT EXISTS idx_decl_overdue ON asset_declarations (is_overdue, status, temple_id);
