package com.templeregistry.service.dc;

import com.templeregistry.dto.request.dc.DcClarifyRequest;
import com.templeregistry.dto.request.dc.WorkflowApproveRequest;
import com.templeregistry.dto.request.dc.WorkflowRejectRequest;
import com.templeregistry.dto.response.dc.WorkflowActionResponse;
import com.templeregistry.security.ScopeHelper;

public interface DeclarationWorkflowService {

    /**
     * Approve a declaration: transitions PENDING_REVIEW → APPROVED.
     * Generates acknowledgement number, publishes notification, refreshes search summary.
     * Requires DISTRICT_COLLECTOR or SUPER_ADMIN role.
     * dc_e2e Sections 3.3, 2.6, 2.7, 2.8.
     */
    WorkflowActionResponse approve(Long declarationId, WorkflowApproveRequest request, ScopeHelper.Claims claims);

    /**
     * Reject a declaration: transitions PENDING_REVIEW → REJECTED (immutable).
     * Requires DISTRICT_COLLECTOR or SUPER_ADMIN role.
     * dc_e2e Section 3.3.
     */
    WorkflowActionResponse reject(Long declarationId, WorkflowRejectRequest request, ScopeHelper.Claims claims);

    /**
     * Request clarification: transitions PENDING_REVIEW → CLARIFICATION_REQUESTED.
     * Saves a clarification record in the direction DC_TO_TEMPLE.
     * Requires DISTRICT_COLLECTOR or SUPER_ADMIN role.
     * dc_e2e Section 3.3.
     */
    WorkflowActionResponse requestClarification(Long declarationId, DcClarifyRequest request, ScopeHelper.Claims claims);

    /**
     * Flag for physical verification: transitions PENDING_REVIEW → PHYSICAL_VERIFICATION_REQUESTED.
     * Saves a clarification record with direction DC_TO_TEMPLE and provided notes.
     * Requires DISTRICT_COLLECTOR or SUPER_ADMIN role.
     * dc_e2e Section 3.3.
     */
    WorkflowActionResponse flagPhysicalVerification(Long declarationId, DcClarifyRequest request, ScopeHelper.Claims claims);
}
