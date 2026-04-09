package com.templeregistry.service.dc;

import com.templeregistry.dto.response.dc.DcDashboardResponse;
import com.templeregistry.security.ScopeHelper;

public interface DcDashboardService {

    /**
     * Returns aggregate KPI metrics for the DC dashboard.
     * District-scoped for DISTRICT_COLLECTOR and DC_STAFF; SUPER_ADMIN sees all districts.
     * dc_e2e Section 7.1.
     */
    DcDashboardResponse getDashboard(ScopeHelper.Claims claims);
}
