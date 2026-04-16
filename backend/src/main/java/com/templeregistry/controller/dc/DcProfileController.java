package com.templeregistry.controller.dc;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.dto.request.dc.ApproveProfileRequest;
import com.templeregistry.dto.request.dc.RejectProfileRequest;
import com.templeregistry.dto.response.dc.WorkflowActionResponse;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.dc.TempleProfileWorkflowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dc/profiles")
@RequiredArgsConstructor
@Tag(name = "DC Profile Workflow", description = "Temple profile staging approval and rejection for the DC portal")
@PreAuthorize(RoleConstants.IS_DC_ROLE)
public class DcProfileController {

    private final TempleProfileWorkflowService templeProfileWorkflowService;

    @PostMapping("/{stagingId}/approve")
    @Operation(summary = "Approve a temple profile staging submission. Promotes content to current profile and archives the previous.")
    public ResponseEntity<ApiResponse<WorkflowActionResponse>> approveProfile(
            @PathVariable Long stagingId,
            @Valid @RequestBody ApproveProfileRequest request) {
        WorkflowActionResponse result = templeProfileWorkflowService.approveProfile(stagingId, request,
                currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Profile approved.", result));
    }

    @PostMapping("/{stagingId}/reject")
    @Operation(summary = "Reject a temple profile staging submission. Status becomes REJECTED (immutable).")
    public ResponseEntity<ApiResponse<WorkflowActionResponse>> rejectProfile(
            @PathVariable Long stagingId,
            @Valid @RequestBody RejectProfileRequest request) {
        WorkflowActionResponse result = templeProfileWorkflowService.rejectProfile(stagingId, request, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Profile rejected.", result));
    }

    private ScopeHelper.Claims currentClaims() {
        return (ScopeHelper.Claims) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
