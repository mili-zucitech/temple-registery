package com.templeregistry.service.dc;

import com.templeregistry.dto.request.dc.ApproveProfileRequest;
import com.templeregistry.dto.request.dc.RejectProfileRequest;
import com.templeregistry.dto.response.dc.WorkflowActionResponse;
import com.templeregistry.security.ScopeHelper;

public interface TempleProfileWorkflowService {

    /**
     * Approve a profile staging submission.
     * Transitions PENDING_REVIEW → APPROVED, promotes content to temple_profile_current,
     * archives previous current to temple_profile_history, publishes notification,
     * and refreshes search summary within the same transaction.
     * Requires DISTRICT_COLLECTOR or SUPER_ADMIN role.
     * dc_e2e Section 4.4.
     */
    WorkflowActionResponse approveProfile(Long stagingId, ApproveProfileRequest request, ScopeHelper.Claims claims);

    /**
     * Reject a profile staging submission.
     * Transitions PENDING_REVIEW → REJECTED (immutable). Publishes notification.
     * Refreshes search summary within the same transaction.
     * Requires DISTRICT_COLLECTOR or SUPER_ADMIN role.
     * dc_e2e Section 4.4.
     */
    WorkflowActionResponse rejectProfile(Long stagingId, RejectProfileRequest request, ScopeHelper.Claims claims);
}
