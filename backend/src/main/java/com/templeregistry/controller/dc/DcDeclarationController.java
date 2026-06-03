package com.templeregistry.controller.dc;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.response.dc.DeclarationDetailResponse;
import com.templeregistry.dto.response.declaration.DeclarationResponse;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.dc.DcTempleProfileService;
import com.templeregistry.service.declaration.DeclarationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * DC Declaration read endpoints — district-scoped listing and detail view.
 *
 * All workflow actions (approve, reject, clarify, flag-physical, under-review, send-back)
 * are handled exclusively by GovernanceWorkflowController at /api/v1/governance/declarations/*.
 */
@RestController
@RequestMapping("/api/v1/dc/declarations")
@RequiredArgsConstructor
@Tag(name = "DC Declarations", description = "District-scoped declaration listing and detail for the DC portal")
@PreAuthorize(RoleConstants.CAN_READ_ALL)
public class DcDeclarationController {

    private final DcTempleProfileService dcTempleProfileService;
    private final DeclarationService declarationService;

    @GetMapping
    @Operation(summary = "List all declarations in the DC's district, paginated. Optionally filter by status and financial year.")
    public ResponseEntity<ApiResponse<PaginatedResponse<DeclarationResponse>>> listDeclarations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String financialYear) {
        ScopeHelper.Claims claims = currentClaims();
        PaginatedResponse<DeclarationResponse> result = declarationService.listByDistrict(
                claims.districtId(), status, financialYear, page, size);
        return ResponseEntity.ok(ApiResponse.success("Declarations retrieved.", result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Returns enriched declaration detail including all sub-table line items and clarification history.")
    public ResponseEntity<ApiResponse<DeclarationDetailResponse>> getDeclarationDetail(@PathVariable Long id) {
        DeclarationDetailResponse detail = dcTempleProfileService.getDeclarationDetail(id, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Declaration detail retrieved.", detail));
    }

    private ScopeHelper.Claims currentClaims() {
        return (ScopeHelper.Claims) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
