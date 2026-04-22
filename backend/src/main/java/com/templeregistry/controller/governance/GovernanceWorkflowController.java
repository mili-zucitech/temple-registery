package com.templeregistry.controller.governance;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.dto.request.dc.DcClarifyRequest;
import com.templeregistry.dto.request.dc.WorkflowApproveRequest;
import com.templeregistry.dto.request.dc.WorkflowRejectRequest;
import com.templeregistry.dto.request.governance.OrderPhysicalVerificationRequest;
import com.templeregistry.dto.request.governance.RejectRequest;
import com.templeregistry.dto.request.governance.SendBackRequest;
import com.templeregistry.dto.request.governance.UpdatePhysicalVerificationRequest;
import com.templeregistry.dto.response.dc.WorkflowActionResponse;
import com.templeregistry.dto.response.governance.PhysicalVerificationHistoryResponse;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.governance.GovernanceWorkflowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Governance workflow endpoints — SINGLE SOURCE OF TRUTH for all workflow transitions.
 *
 * Modules with DC approval: TRUST and ASSET DECLARATION only.
 * Staff and Contractors do NOT have DC approval — they are excluded from this controller.
 *
 * ACCESS CONTROL:
 * - Submit endpoints: TEMPLE_AUTHORITY only
 * - Approve / Send Back / Reject / Clarify / Under-Review / Flag-Physical: DISTRICT_COLLECTOR only
 * - Physical verification order/update: DISTRICT_COLLECTOR only
 * - Physical verification history: DISTRICT_COLLECTOR + DC_STAFF (read-only)
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/governance")
@Tag(name = "Governance Workflow", description = "Submit, Send Back, Reject, Approve, Clarify across all modules — single source of truth")
public class GovernanceWorkflowController {

    private final GovernanceWorkflowService governanceWorkflowService;

    // =========================================================================
    // TRUST
    // =========================================================================

    @PostMapping("/trusts/{trustId}/submit")
    @Operation(summary = "TA: Submit trust for DC approval (DRAFT or SENT_BACK → SUBMITTED)")
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public ResponseEntity<ApiResponse<Void>> submitTrust(@PathVariable Long trustId) {
        governanceWorkflowService.submitTrust(trustId);
        return ResponseEntity.ok(ApiResponse.success("Trust submitted for DC approval."));
    }

    @PostMapping("/trusts/{trustId}/approve")
    @Operation(summary = "DC: Approve trust (SUBMITTED → APPROVED)")
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public ResponseEntity<ApiResponse<Void>> approveTrust(@PathVariable Long trustId) {
        governanceWorkflowService.approveTrust(trustId);
        return ResponseEntity.ok(ApiResponse.success("Trust approved."));
    }

    @PostMapping("/trusts/{trustId}/send-back")
    @Operation(summary = "DC: Send back trust with mandatory free-text reason (SUBMITTED → SENT_BACK)")
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public ResponseEntity<ApiResponse<Void>> sendBackTrust(
            @PathVariable Long trustId,
            @Valid @RequestBody SendBackRequest request) {
        governanceWorkflowService.sendBackTrust(trustId, request);
        return ResponseEntity.ok(ApiResponse.success("Trust sent back to temple authority."));
    }

    @PostMapping("/trusts/{trustId}/reject")
    @Operation(summary = "DC: Reject trust — terminal, TA must create new (SUBMITTED → REJECTED)")
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public ResponseEntity<ApiResponse<Void>> rejectTrust(
            @PathVariable Long trustId,
            @Valid @RequestBody RejectRequest request) {
        governanceWorkflowService.rejectTrust(trustId, request);
        return ResponseEntity.ok(ApiResponse.success("Trust rejected."));
    }

    // =========================================================================
    // DECLARATION
    // =========================================================================

    @PostMapping("/declarations/{declarationId}/submit")
    @Operation(summary = "TA: Submit declaration for DC approval")
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public ResponseEntity<ApiResponse<Void>> submitDeclaration(@PathVariable Long declarationId) {
        governanceWorkflowService.submitDeclaration(declarationId);
        return ResponseEntity.ok(ApiResponse.success("Declaration submitted for DC approval."));
    }

    @PostMapping("/declarations/{declarationId}/approve")
    @Operation(summary = "DC: Approve declaration. Blocked if physical verification has FAILED. Generates acknowledgement number.")
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public ResponseEntity<ApiResponse<WorkflowActionResponse>> approveDeclaration(
            @PathVariable Long declarationId,
            @Valid @RequestBody(required = false) WorkflowApproveRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        WorkflowActionResponse result = governanceWorkflowService.approveDeclaration(
                declarationId, request != null ? request : new WorkflowApproveRequest(), currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Declaration approved.", result));
    }

    @PostMapping("/declarations/{declarationId}/send-back")
    @Operation(summary = "DC: Send back declaration with mandatory free-text reason")
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public ResponseEntity<ApiResponse<Void>> sendBackDeclaration(
            @PathVariable Long declarationId,
            @Valid @RequestBody SendBackRequest request) {
        governanceWorkflowService.sendBackDeclaration(declarationId, request);
        return ResponseEntity.ok(ApiResponse.success("Declaration sent back to temple authority."));
    }

    @PostMapping("/declarations/{declarationId}/reject")
    @Operation(summary = "DC: Reject declaration — terminal, TA must create new")
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public ResponseEntity<ApiResponse<WorkflowActionResponse>> rejectDeclaration(
            @PathVariable Long declarationId,
            @Valid @RequestBody WorkflowRejectRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        WorkflowActionResponse result = governanceWorkflowService.rejectDeclaration(
                declarationId, request, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Declaration rejected.", result));
    }

    @PostMapping("/declarations/{declarationId}/clarify")
    @Operation(summary = "DC: Request clarification on a declaration. Transitions PENDING_REVIEW → CLARIFICATION_REQUESTED. Max 3 rounds.")
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public ResponseEntity<ApiResponse<WorkflowActionResponse>> clarifyDeclaration(
            @PathVariable Long declarationId,
            @Valid @RequestBody DcClarifyRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        WorkflowActionResponse result = governanceWorkflowService.requestClarification(
                declarationId, request, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Clarification requested.", result));
    }

    @PostMapping("/declarations/{declarationId}/under-review")
    @Operation(summary = "DC: Mark a declaration as under active review. Transitions PENDING_REVIEW / RESUBMITTED → UNDER_REVIEW.")
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public ResponseEntity<ApiResponse<WorkflowActionResponse>> markUnderReview(
            @PathVariable Long declarationId) {
        WorkflowActionResponse result = governanceWorkflowService.markUnderReview(
                declarationId, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Declaration marked as under review.", result));
    }

    @PostMapping("/declarations/{declarationId}/flag-physical")
    @Operation(summary = "DC: Flag a declaration for physical verification. Transitions PENDING_REVIEW / UNDER_REVIEW / RESUBMITTED → PHYSICAL_VERIFICATION_REQUESTED.")
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public ResponseEntity<ApiResponse<WorkflowActionResponse>> flagPhysicalVerification(
            @PathVariable Long declarationId,
            @Valid @RequestBody DcClarifyRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        WorkflowActionResponse result = governanceWorkflowService.flagPhysicalVerification(
                declarationId, request, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Flagged for physical verification.", result));
    }

    // =========================================================================
    // PHYSICAL VERIFICATION — DC only
    // =========================================================================

    @PostMapping("/declarations/{declarationId}/physical-verification/order")
    @Operation(summary = "DC: Order physical verification for a declaration. Manual only — never auto-triggered.")
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public ResponseEntity<ApiResponse<Void>> orderPhysicalVerification(
            @PathVariable Long declarationId,
            @Valid @RequestBody OrderPhysicalVerificationRequest request) {
        governanceWorkflowService.orderPhysicalVerification(declarationId, request);
        return ResponseEntity.ok(ApiResponse.success("Physical verification ordered."));
    }

    @PostMapping("/declarations/{declarationId}/physical-verification/update")
    @Operation(summary = "DC: Update physical verification result (PHYSICALLY_VERIFIED or VERIFICATION_FAILED)")
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public ResponseEntity<ApiResponse<Void>> updatePhysicalVerification(
            @PathVariable Long declarationId,
            @Valid @RequestBody UpdatePhysicalVerificationRequest request) {
        governanceWorkflowService.updatePhysicalVerification(declarationId, request);
        return ResponseEntity.ok(ApiResponse.success("Physical verification status updated."));
    }

    @GetMapping("/declarations/{declarationId}/physical-verification/history")
    @Operation(summary = "DC: Get physical verification history for a declaration. DC-only — never expose to TA.")
    @PreAuthorize(RoleConstants.IS_DC_ROLE)
    public ResponseEntity<ApiResponse<List<PhysicalVerificationHistoryResponse>>> getPhysicalVerificationHistory(
            @PathVariable Long declarationId) {
        List<PhysicalVerificationHistoryResponse> history =
                governanceWorkflowService.getPhysicalVerificationHistory(declarationId);
        return ResponseEntity.ok(ApiResponse.success("Physical verification history retrieved.", history));
    }

    private ScopeHelper.Claims currentClaims() {
        return (ScopeHelper.Claims) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
