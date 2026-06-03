-- V8: Normalize legacy declaration status strings in temples and temple_search_summary.
--
-- Migration V42 (applied in production) renamed four status values.
-- Any rows written before that rename still carry the old strings and will not match
-- the canonical equality predicates used by DcTempleSearchServiceImpl.
-- This migration brings those rows up to the canonical enum names so the IN-query
-- fallback in expandDeclarationStatus() is only needed as a safety net going forward.
--
-- Legacy → Canonical mappings (mirrors DeclarationStatusConverter.LEGACY_ALIASES):
--   PENDING_REVIEW                  → SUBMITTED
--   RESUBMITTED                     → SUBMITTED
--   CLARIFICATION_REQUESTED         → CLARIFICATION_REQUIRED
--   PHYSICAL_VERIFICATION_REQUESTED → SITE_VISIT_SCHEDULED

-- ── temples.asset_declaration_status ─────────────────────────────────────────

UPDATE temples
SET asset_declaration_status = 'SUBMITTED'
WHERE asset_declaration_status IN ('PENDING_REVIEW', 'RESUBMITTED');

UPDATE temples
SET asset_declaration_status = 'CLARIFICATION_REQUIRED'
WHERE asset_declaration_status = 'CLARIFICATION_REQUESTED';

UPDATE temples
SET asset_declaration_status = 'SITE_VISIT_SCHEDULED'
WHERE asset_declaration_status = 'PHYSICAL_VERIFICATION_REQUESTED';

-- ── temple_search_summary.asset_declaration_status ───────────────────────────

UPDATE temple_search_summary
SET asset_declaration_status = 'SUBMITTED'
WHERE asset_declaration_status IN ('PENDING_REVIEW', 'RESUBMITTED');

UPDATE temple_search_summary
SET asset_declaration_status = 'CLARIFICATION_REQUIRED'
WHERE asset_declaration_status = 'CLARIFICATION_REQUESTED';

UPDATE temple_search_summary
SET asset_declaration_status = 'SITE_VISIT_SCHEDULED'
WHERE asset_declaration_status = 'PHYSICAL_VERIFICATION_REQUESTED';
