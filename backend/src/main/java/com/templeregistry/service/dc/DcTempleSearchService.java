package com.templeregistry.service.dc;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.temple.TempleSearchFilterRequest;
import com.templeregistry.dto.response.dc.DcTempleSearchItemResponse;
import com.templeregistry.security.ScopeHelper;

public interface DcTempleSearchService {

    /**
     * Returns a paginated, district-scoped search over temple_search_summary.
     *
     * DISTRICT_COLLECTOR and DC_STAFF: districtId is always overridden to the principal's districtId.
     * SUPER_ADMIN: may supply any districtId or null to search all districts.
     * dc_e2e Section 3.1 — Temple Search.
     */
    PaginatedResponse<DcTempleSearchItemResponse> search(TempleSearchFilterRequest filter, ScopeHelper.Claims claims);
}
