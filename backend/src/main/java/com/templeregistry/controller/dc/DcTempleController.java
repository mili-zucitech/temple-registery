package com.templeregistry.controller.dc;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.dc.FlagTempleProfileRequest;
import com.templeregistry.dto.request.dc.UnflagTempleProfileRequest;
import com.templeregistry.dto.request.dc.VerifyTempleProfileRequest;
import com.templeregistry.dto.request.temple.TempleSearchFilterRequest;
import com.templeregistry.dto.response.dc.DcTempleSearchItemResponse;
import com.templeregistry.dto.response.dc.DeclarationDetailResponse;
import com.templeregistry.dto.response.dc.ProfileStagingResponse;
import com.templeregistry.dto.response.dc.TempleFullProfileResponse;
import com.templeregistry.dto.response.dc.TempleVerificationResponse;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.dc.DcTempleProfileService;
import com.templeregistry.service.dc.DcTempleSearchService;
import com.templeregistry.service.dc.DcTempleVerificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dc/temples")
@RequiredArgsConstructor
@Tag(name = "DC Temples", description = "Temple search, profile access, and verification for the DC portal")
@PreAuthorize(RoleConstants.CAN_READ_TEMPLES)
public class DcTempleController {

    private final DcTempleSearchService dcTempleSearchService;
    private final DcTempleProfileService dcTempleProfileService;
    private final DcTempleVerificationService dcTempleVerificationService;

    @GetMapping
    @PreAuthorize(RoleConstants.CAN_READ_TEMPLES)
    @Operation(summary = "Paginated, district-scoped temple search. District is auto-scoped from JWT for DC roles.")
    public ResponseEntity<ApiResponse<PaginatedResponse<DcTempleSearchItemResponse>>> search(
            @Valid TempleSearchFilterRequest filter) {
        PaginatedResponse<DcTempleSearchItemResponse> result = dcTempleSearchService.search(filter, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Temples retrieved.", result));
    }

    @GetMapping("/{id}")
    @PreAuthorize(RoleConstants.CAN_READ_TEMPLES)
    @Operation(summary = "Returns the aggregated full temple profile including trust, board, financials, employees, contractors, and declarations.")
    public ResponseEntity<ApiResponse<TempleFullProfileResponse>> getFullProfile(@PathVariable Long id) {
        TempleFullProfileResponse profile = dcTempleProfileService.getFullProfile(id, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Temple profile retrieved.", profile));
    }

    @GetMapping("/{templeId}/profile/pending")
    @Operation(summary = "Returns the pending profile staging submission awaiting DC review.")
    public ResponseEntity<ApiResponse<ProfileStagingResponse>> getPendingProfileStaging(
            @PathVariable Long templeId) {
        ProfileStagingResponse staging = dcTempleProfileService.getPendingProfileStaging(templeId, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Pending profile staging retrieved.", staging));
    }

    /* ── Temple Profile Verification Workflow (DC) ────────── */

    @PostMapping("/{templeId}/verify")
    @PreAuthorize(RoleConstants.IS_DC_ROLE)
    @Operation(summary = "Verify a temple profile. Sets isVerifiedByDc=true and removes any existing flag.")
    public ResponseEntity<ApiResponse<TempleVerificationResponse>> verifyTempleProfile(
            @PathVariable Long templeId,
            @Valid @RequestBody VerifyTempleProfileRequest request) {
        TempleVerificationResponse result = dcTempleVerificationService.verifyTempleProfile(
                templeId, request, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Temple profile verified.", result));
    }

    @PostMapping("/{templeId}/flag")
    @PreAuthorize(RoleConstants.IS_DC_ROLE)
    @Operation(summary = "Flag a temple profile for issues. Sets isFlaggedByDc=true and removes verification.")
    public ResponseEntity<ApiResponse<TempleVerificationResponse>> flagTempleProfile(
            @PathVariable Long templeId,
            @Valid @RequestBody FlagTempleProfileRequest request) {
        TempleVerificationResponse result = dcTempleVerificationService.flagTempleProfile(
                templeId, request, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Temple profile flagged.", result));
    }

    @PostMapping("/{templeId}/unflag")
    @PreAuthorize(RoleConstants.IS_DC_ROLE)
    @Operation(summary = "Remove flag from a temple profile. Sets isFlaggedByDc=false.")
    public ResponseEntity<ApiResponse<TempleVerificationResponse>> unflagTempleProfile(
            @PathVariable Long templeId,
            @Valid @RequestBody UnflagTempleProfileRequest request) {
        TempleVerificationResponse result = dcTempleVerificationService.unflagTempleProfile(
                templeId, request, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Temple profile flag removed.", result));
    }

    @GetMapping("/{templeId}/verification-status")
    @Operation(summary = "Get current verification and flagging status of a temple profile.")
    public ResponseEntity<ApiResponse<TempleVerificationResponse>> getVerificationStatus(
            @PathVariable Long templeId) {
        TempleVerificationResponse result = dcTempleVerificationService.getVerificationStatus(
                templeId, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Verification status retrieved.", result));
    }

    private ScopeHelper.Claims currentClaims() {
        return (ScopeHelper.Claims) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
