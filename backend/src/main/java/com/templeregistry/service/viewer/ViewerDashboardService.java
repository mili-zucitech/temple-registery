package com.templeregistry.service.viewer;

import com.templeregistry.dto.response.viewer.ViewerDashboardResponse;

public interface ViewerDashboardService {

    /**
     * Aggregates read-only KPIs for the Viewer (State Government / Audit Bodies) dashboard.
     * Reuses existing AuditorService and ObservationService — no new DB queries.
     */
    ViewerDashboardResponse getDashboard();
}
