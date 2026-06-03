package com.templeregistry.service.temple;

public interface TempleSearchSummaryService {

    /** Rebuild the temple_search_summary table for a single temple (call after any temple mutation). */
    void refresh(Long templeId);

    /**
     * Safe variant for calling inside a {@code @Transactional} method.
     * Registers an afterCommit callback so the async refresh runs only after the
     * calling transaction commits, eliminating the read-before-commit race.
     * Falls back to a direct {@link #refresh} call when no active transaction is present.
     */
    void scheduleRefresh(Long templeId);

    /** Full rebuild of all records in temple_search_summary (Super Admin triggered). */
    void rebuildAll();
}
