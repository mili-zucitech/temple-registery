package com.templeregistry.service.temple;

public interface TempleSearchSummaryService {

    /** Rebuild the temple_search_summary table for a single temple (call after any temple mutation). */
    void refresh(Long templeId);

    /** Full rebuild of all records in temple_search_summary (Super Admin triggered). */
    void rebuildAll();
}
