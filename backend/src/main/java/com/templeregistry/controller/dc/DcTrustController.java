package com.templeregistry.controller.dc;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.dto.request.dc.RejectProfileRequest;
import com.templeregistry.dto.response.trust.BoardMemberResponse;
import com.templeregistry.dto.response.trust.TrustResponse;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.dc.DcTrustWorkflowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dc/trusts")
@RequiredArgsConstructor
@Tag(name = "DC Trust Workflow", description = "Trust and Board Member approval/rejection for the DC portal")
public class DcTrustController {

    private final DcTrustWorkflowService dcTrustWorkflowService;

    @PostMapping("/{trustId}/approve")
    @Operation(summary = "Approve a trust submission")
    public ResponseEntity<ApiResponse<TrustResponse>> approveTrust(@PathVariable Long trustId) {
        TrustResponse result = dcTrustWorkflowService.approveTrust(trustId, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Trust approved.", result));
    }

    @PostMapping("/{trustId}/reject")
    @Operation(summary = "Reject a trust submission")
    public ResponseEntity<ApiResponse<TrustResponse>> rejectTrust(
            @PathVariable Long trustId,
            @Valid @RequestBody RejectProfileRequest request) {
        TrustResponse result = dcTrustWorkflowService.rejectTrust(trustId, request.getRemarks(), currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Trust rejected.", result));
    }

    @PostMapping("/board-members/{memberId}/approve")
    @Operation(summary = "Approve a board member submission")
    public ResponseEntity<ApiResponse<BoardMemberResponse>> approveBoardMember(@PathVariable Long memberId) {
        BoardMemberResponse result = dcTrustWorkflowService.approveBoardMember(memberId, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Board member approved.", result));
    }

    @PostMapping("/board-members/{memberId}/reject")
    @Operation(summary = "Reject a board member submission")
    public ResponseEntity<ApiResponse<BoardMemberResponse>> rejectBoardMember(
            @PathVariable Long memberId,
            @Valid @RequestBody RejectProfileRequest request) {
        BoardMemberResponse result = dcTrustWorkflowService.rejectBoardMember(memberId, request.getRemarks(), currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Board member rejected.", result));
    }

    private ScopeHelper.Claims currentClaims() {
        return (ScopeHelper.Claims) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
