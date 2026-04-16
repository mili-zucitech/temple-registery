package com.templeregistry.controller.dc;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.dc.DcClarifyRequest;
import com.templeregistry.dto.request.dc.WorkflowApproveRequest;
import com.templeregistry.dto.request.dc.WorkflowRejectRequest;
import com.templeregistry.dto.response.dc.DeclarationDetailResponse;
import com.templeregistry.dto.response.dc.WorkflowActionResponse;
import com.templeregistry.dto.response.declaration.DeclarationResponse;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.dc.DcTempleProfileService;
import com.templeregistry.service.dc.DeclarationWorkflowService;
import com.templeregistry.service.declaration.DeclarationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dc/declarations")
@RequiredArgsConstructor
@Tag(name = "DC Declaration Workflow", description = "Declaration review and workflow actions for the DC portal")
@PreAuthorize(RoleConstants.IS_DC_ROLE)
public class DcDeclarationController {

    private final DcTempleProfileService dcTempleProfileService;
    private final DeclarationWorkflowService declarationWorkflowService;
    private final DeclarationService declarationService;

    @GetMapping
    @Operation(summary = "List all declarations in the DC's district, paginated. Optionally filter by status and financial year.")
    public ResponseEntity<ApiResponse<PaginatedResponse<DeclarationResponse>>> listDeclarations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String financialYear) {
        ScopeHelper.Claims claims = currentClaims();
        PaginatedResponse<DeclarationResponse> result = declarationService.listByDistrict(claims.districtId(), status, financialYear,
                page, size);
        return ResponseEntity.ok(ApiResponse.success("Declarations retrieved.", result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Returns enriched declaration detail including all sub-table line items and clarification history.")
    public ResponseEntity<ApiResponse<DeclarationDetailResponse>> getDeclarationDetail(@PathVariable Long id) {
        DeclarationDetailResponse detail = dcTempleProfileService.getDeclarationDetail(id, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Declaration detail retrieved.", detail));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve a declaration. Transitions PENDING_REVIEW → APPROVED. Generates acknowledgement and sends notification.")
    public ResponseEntity<ApiResponse<WorkflowActionResponse>> approve(
            @PathVariable Long id,
            @Valid @RequestBody WorkflowApproveRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        WorkflowActionResponse result = declarationWorkflowService.approve(id, request, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Declaration approved.", result));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject a declaration. Transitions PENDING_REVIEW → REJECTED (immutable).")
    public ResponseEntity<ApiResponse<WorkflowActionResponse>> reject(
            @PathVariable Long id,
            @Valid @RequestBody WorkflowRejectRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        WorkflowActionResponse result = declarationWorkflowService.reject(id, request, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Declaration rejected.", result));
    }

    @PostMapping("/{id}/clarify")
    @Operation(summary = "Request clarification on a declaration. Transitions PENDING_REVIEW → CLARIFICATION_REQUESTED.")
    public ResponseEntity<ApiResponse<WorkflowActionResponse>> clarify(
            @PathVariable Long id,
            @Valid @RequestBody DcClarifyRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        WorkflowActionResponse result = declarationWorkflowService.requestClarification(id, request, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Clarification requested.", result));
    }

    @PostMapping("/{id}/flag-physical")
    @Operation(summary = "Flag a declaration for physical verification. Transitions PENDING_REVIEW / UNDER_REVIEW / RESUBMITTED → PHYSICAL_VERIFICATION_REQUESTED.")
    public ResponseEntity<ApiResponse<WorkflowActionResponse>> flagPhysical(
            @PathVariable Long id,
            @Valid @RequestBody DcClarifyRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        WorkflowActionResponse result = declarationWorkflowService.flagPhysicalVerification(id, request,
                currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Flagged for physical verification.", result));
    }

    @PostMapping("/{id}/under-review")
    @Operation(summary = "Mark a declaration as under active review. Transitions PENDING_REVIEW / RESUBMITTED → UNDER_REVIEW.")
    public ResponseEntity<ApiResponse<WorkflowActionResponse>> markUnderReview(
            @PathVariable Long id) {
        WorkflowActionResponse result = declarationWorkflowService.markUnderReview(id, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Declaration marked as under review.", result));
    }

    private ScopeHelper.Claims currentClaims() {
        return (ScopeHelper.Claims) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
