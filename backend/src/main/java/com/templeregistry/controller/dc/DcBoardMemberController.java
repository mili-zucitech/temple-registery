package com.templeregistry.controller.dc;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.dto.request.dc.DcFlagRequest;
import com.templeregistry.dto.request.dc.DcVerifyRequest;
import com.templeregistry.dto.response.trust.BoardMemberResponse;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.trust.TrustService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * DC endpoints for board member governance actions.
 * Approve or reject board members submitted by Temple Authority.
 * Temple Authority receives an in-app notification for each action.
 */
@RestController
@RequestMapping("/api/v1/dc/trusts/{trustId}/board-members")
@RequiredArgsConstructor
@Tag(name = "DC Board Members", description = "DC governance actions on board members")
@PreAuthorize(RoleConstants.IS_DC_ROLE)
public class DcBoardMemberController {

    private final TrustService trustService;

    @PostMapping("/{memberId}/approve")
    @Operation(summary = "Approve a board member — notifies Temple Authority")
    public ResponseEntity<ApiResponse<BoardMemberResponse>> approve(
            @PathVariable Long trustId,
            @PathVariable Long memberId,
            @Valid @RequestBody DcVerifyRequest request) {
        BoardMemberResponse result = trustService.approveBoardMember(
                trustId, memberId, request.getNotes(), currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Board member approved.", result));
    }

    @PostMapping("/{memberId}/reject")
    @Operation(summary = "Reject a board member — notifies Temple Authority")
    public ResponseEntity<ApiResponse<BoardMemberResponse>> reject(
            @PathVariable Long trustId,
            @PathVariable Long memberId,
            @Valid @RequestBody DcFlagRequest request) {
        BoardMemberResponse result = trustService.rejectBoardMember(
                trustId, memberId, request.getReason(), currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Board member rejected.", result));
    }

    private ScopeHelper.Claims currentClaims() {
        return (ScopeHelper.Claims) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
