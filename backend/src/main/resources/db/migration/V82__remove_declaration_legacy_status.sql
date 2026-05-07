-- V82: Remove legacy status columns from asset_declarations
-- These columns duplicated WorkflowInstance.status (set via Phase A dual-write).
-- The Java entity field AssetDeclaration.status is retained for Phase A query compatibility.
-- Remove this comment and the entity field after all queries are migrated to WorkflowInstance.
--
-- NOTE: is_overdue and overdue_flagged_at are kept — they are domain fields used for
-- deadline management, not governance status fields.
--
-- TiDB (error 8200): requires dropping all covering indexes before dropping the column.
-- Live DB has two indexes covering status:
--   idx_decl_status        (status)                    -- single-column
--   idx_decl_overdue       (is_overdue, status, temple_id) -- composite

ALTER TABLE asset_declarations DROP INDEX idx_decl_status;
ALTER TABLE asset_declarations DROP INDEX idx_decl_overdue;

ALTER TABLE asset_declarations DROP COLUMN status;
