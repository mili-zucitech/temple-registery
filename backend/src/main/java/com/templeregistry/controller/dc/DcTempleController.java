package com.templeregistry.controller.dc;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.temple.TempleSearchFilterRequest;
import com.templeregistry.dto.response.dc.DcTempleSearchItemResponse;
import com.templeregistry.dto.response.dc.DeclarationDetailResponse;
import com.templeregistry.dto.response.dc.ProfileStagingResponse;
import com.templeregistry.dto.response.dc.TempleFullProfileResponse;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.dc.DcTempleProfileService;
import com.templeregistry.service.dc.DcTempleSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dc/temples")
@RequiredArgsConstructor
@Tag(name = "DC Temples", description = "Temple search and profile access for the DC portal")
@PreAuthorize(RoleConstants.IS_DC_ROLE)
public class DcTempleController {

    private final DcTempleSearchService dcTempleSearchService;
    private final DcTempleProfileService dcTempleProfileService;

    @GetMapping
    @Operation(summary = "Paginated, district-scoped temple search. District is auto-scoped from JWT for DC roles.")
    public ResponseEntity<ApiResponse<PaginatedResponse<DcTempleSearchItemResponse>>> search(
            @Valid TempleSearchFilterRequest filter) {
        PaginatedResponse<DcTempleSearchItemResponse> result = dcTempleSearchService.search(filter, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Temples retrieved.", result));
    }

    @GetMapping("/{id}")
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

    private ScopeHelper.Claims currentClaims() {
        return (ScopeHelper.Claims) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
