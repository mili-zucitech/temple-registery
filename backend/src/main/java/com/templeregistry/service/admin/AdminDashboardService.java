package com.templeregistry.service.admin;

import com.templeregistry.dto.response.admin.StatewideDashboardResponse;

public interface AdminDashboardService {

    /**
     * Aggregates statewide KPIs for SUPER_ADMIN dashboard.
     * Uses denormalized temple_search_summary for performance.
     */
    StatewideDashboardResponse getStatewideDashboard();
}
