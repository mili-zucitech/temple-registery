package com.templeregistry.service.governance;

import com.templeregistry.dto.request.dc.DcClarifyRequest;
import com.templeregistry.dto.request.dc.WorkflowApproveRequest;
import com.templeregistry.dto.request.dc.WorkflowRejectRequest;
import com.templeregistry.dto.request.governance.OrderPhysicalVerificationRequest;
import com.templeregistry.dto.request.governance.RejectRequest;
import com.templeregistry.dto.request.governance.SendBackRequest;
import com.templeregistry.dto.request.governance.UpdatePhysicalVerificationRequest;
import com.templeregistry.dto.response.dc.WorkflowActionResponse;
import com.templeregistry.dto.response.governance.PhysicalVerificationHistoryResponse;
import com.templeregistry.security.ScopeHelper;

import java.util.List;

/**
 * Core governance workflow service — SINGLE SOURCE OF TRUTH for all workflow transitions.
 *
 * Handles Submit, Send Back, Reject, Approve, Clarify, Under-Review, and Physical Verification
 * for governed modules: TRUST and ASSET DECLARATION only.
 *
 * Staff (Employee) and Contractors do NOT use DC approval workflow.
 * Changes to those modules are effective immediately on save.
 */
public interface GovernanceWorkflowService {

    // ─── Temple Authority Actions ─────────────────────────────────────────────

    /** TA submits a Trust (Trust + Board treated as one unit). */
    void submitTrust(Long trustId);

    /** TA submits an Asset Declaration. */
    void submitDeclaration(Long declarationId);

    // ─── DC Actions — Trust ───────────────────────────────────────────────────

    /** DC approves a Trust. */
    void approveTrust(Long trustId);

    /** DC sends back a Trust with mandatory free-text reason. */
    void sendBackTrust(Long trustId, SendBackRequest request);

    /** DC rejects a Trust (terminal — TA must create new). */
    void rejectTrust(Long trustId, RejectRequest request);

    // ─── DC Actions — Declaration ─────────────────────────────────────────────

    /**
     * DC approves an Asset Declaration.
     * Blocked if physicalVerificationStatus = VERIFICATION_FAILED.
     * Generates acknowledgement number on approval.
     */
    WorkflowActionResponse approveDeclaration(Long declarationId, WorkflowApproveRequest request,
                                               ScopeHelper.Claims claims,
                                               String idempotencyKey);

    default WorkflowActionResponse approveDeclaration(Long declarationId, WorkflowApproveRequest request,
                                                      ScopeHelper.Claims claims) {
        return approveDeclaration(declarationId, request, claims, null);
    }

    /** DC sends back an Asset Declaration with mandatory free-text reason. */
    void sendBackDeclaration(Long declarationId, SendBackRequest request);

    /** DC rejects an Asset Declaration (terminal). */
    WorkflowActionResponse rejectDeclaration(Long declarationId, WorkflowRejectRequest request,
                                              ScopeHelper.Claims claims,
                                              String idempotencyKey);

    default WorkflowActionResponse rejectDeclaration(Long declarationId, WorkflowRejectRequest request,
                                                     ScopeHelper.Claims claims) {
        return rejectDeclaration(declarationId, request, claims, null);
    }

    /**
     * DC requests clarification on a declaration.
     * Transitions PENDING_REVIEW → CLARIFICATION_REQUESTED.
     * Max 3 clarification rounds; escalates to SUPER_ADMIN on round 2.
     */
    WorkflowActionResponse requestClarification(Long declarationId, DcClarifyRequest request,
                                                 ScopeHelper.Claims claims,
                                                 String idempotencyKey);

    default WorkflowActionResponse requestClarification(Long declarationId, DcClarifyRequest request,
                                                        ScopeHelper.Claims claims) {
        return requestClarification(declarationId, request, claims, null);
    }

    /**
     * DC marks a declaration as under active review.
     * Transitions PENDING_REVIEW / RESUBMITTED → UNDER_REVIEW.
     */
    WorkflowActionResponse markUnderReview(Long declarationId, ScopeHelper.Claims claims);

    /**
     * DC flags a declaration for physical verification.
     * Transitions SUBMITTED / UNDER_REVIEW → SITE_VISIT_SCHEDULED.
     */
    WorkflowActionResponse flagPhysicalVerification(Long declarationId, DcClarifyRequest request,
                                                     ScopeHelper.Claims claims,
                                                     String idempotencyKey);

    default WorkflowActionResponse flagPhysicalVerification(Long declarationId, DcClarifyRequest request,
                                                            ScopeHelper.Claims claims) {
        return flagPhysicalVerification(declarationId, request, claims, null);
    }

    /**
     * DC schedules a site visit for a declaration.
     * Transitions SUBMITTED / UNDER_REVIEW → SITE_VISIT_SCHEDULED.
     */
    void scheduleSiteVisit(Long id, com.templeregistry.dto.request.governance.SiteVisitRequest request, ScopeHelper.Claims claims);

    /**
     * DC/Inspector completes a site visit.
     * Transitions SITE_VISIT_SCHEDULED → SITE_VISIT_COMPLETED.
     */
    void completeSiteVisit(Long id, ScopeHelper.Claims claims);

    /**
     * DC marks a declaration as verified after site visit.
     * Transitions SITE_VISIT_COMPLETED → VERIFIED.
     */
    void verifyDeclaration(Long id, ScopeHelper.Claims claims);

    /**
     * DC marks a site visit as failed.
     * Sets physicalVerificationStatus = VERIFICATION_FAILED without changing status.
     */
    void failSiteVisit(Long id, ScopeHelper.Claims claims);

    // ─── Physical Verification (Declarations only) ────────────────────────────

    /**
     * DC manually orders physical verification for a declaration.
     * Sets physicalVerificationStatus → ORDERED_FOR_PHYSICAL_VERIFICATION.
     * System must NEVER call this automatically.
     */
    void orderPhysicalVerification(Long declarationId, OrderPhysicalVerificationRequest request);

    /**
     * DC updates physical verification result.
     * Allowed: ORDERED_FOR_PHYSICAL_VERIFICATION → PHYSICALLY_VERIFIED or VERIFICATION_FAILED.
     */
    void updatePhysicalVerification(Long declarationId, UpdatePhysicalVerificationRequest request);

    /**
     * Returns physical verification history for a declaration.
     * DC-only — must NEVER be called from a TA-accessible endpoint.
     */
    List<PhysicalVerificationHistoryResponse> getPhysicalVerificationHistory(Long declarationId);
}
