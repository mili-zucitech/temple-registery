package com.templeregistry.service.dc;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.response.dc.DeclarationDetailResponse;
import com.templeregistry.dto.response.dc.DcProfileHistoryEntry;
import com.templeregistry.dto.response.dc.ProfileStagingResponse;
import com.templeregistry.dto.response.dc.TempleFullProfileResponse;
import com.templeregistry.security.ScopeHelper;

public interface DcTempleProfileService {

    /**
     * Returns the aggregated full temple profile for the DC portal.
     * Combines: temple core data, geo labels, trust, board members, financials,
     * employees, contractors, declarations, and the currently approved profile.
     * Enforces district scope per dc_e2e Section 3.2.
     */
    TempleFullProfileResponse getFullProfile(Long templeId, ScopeHelper.Claims claims);

    /**
     * Returns enriched declaration detail including all 8 sub-table line-item lists
     * and the full clarification exchange history.
     * Enforces district scope.
     * dc_e2e Section 3.5.
     */
    DeclarationDetailResponse getDeclarationDetail(Long declarationId, ScopeHelper.Claims claims);

    /**
     * Returns the pending profile staging submission for a temple (PENDING_REVIEW status).
     * Used by the DC portal to render the profile review screen.
     * dc_e2e Section 4.4.
     */
    ProfileStagingResponse getPendingProfileStaging(Long templeId, ScopeHelper.Claims claims);

    /**
     * Returns the full profile submission history for a temple, ordered by version descending.
     * Includes all statuses (APPROVED, REJECTED, SUBMITTED, etc.).
     * dc_e2e Section 4.5.
     */
    PaginatedResponse<DcProfileHistoryEntry> getProfileHistory(Long templeId, ScopeHelper.Claims claims, int page, int size);
}
