-- V23: Add compound indexes for the most common DC filter combinations.
-- These dramatically improve query performance when a DC narrows from
-- district → taluk or district → hobli (the two most used drill-down patterns).

CREATE INDEX IF NOT EXISTS idx_tss_district_taluk
    ON temple_search_summary (district_id, taluk_id);

CREATE INDEX IF NOT EXISTS idx_tss_district_hobli
    ON temple_search_summary (district_id, hobli_id);

-- Compound index for the combined status + district filter
-- (e.g. "show all OVERDUE temples in my district")
CREATE INDEX IF NOT EXISTS idx_tss_district_status
    ON temple_search_summary (district_id, asset_declaration_status);
