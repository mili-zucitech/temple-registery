package com.templeregistry.controller.dc;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.dto.request.dc.DcFlagRequest;
import com.templeregistry.dto.request.dc.DcVerifyRequest;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.dc.DcComplianceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * DC compliance endpoints for governed modules: Temple and Trust only.
 *
 * Staff (Employee) and Contractor modules have NO DC approval or verification workflow.
 * Any attempt to verify/flag Staff or Contractors will result in 404 (endpoint does not exist).
 */
@RestController
@RequestMapping("/api/v1/dc/compliance")
@RequiredArgsConstructor
@Tag(name = "DC Compliance", description = "Endpoints for DC to verify or flag governance entities")
@PreAuthorize(RoleConstants.CAN_ACT_DC)
public class DcComplianceController {

    private final DcComplianceService dcComplianceService;

    @PostMapping("/temples/{id}/verify")
    @Operation(summary = "Mark a Temple as VERIFIED")
    public ResponseEntity<ApiResponse<Void>> verifyTemple(@PathVariable Long id,
            @RequestBody @Valid DcVerifyRequest req) {
        dcComplianceService.verifyTemple(id, req, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Temple marked as verified."));
    }

    @PostMapping("/temples/{id}/flag")
    @Operation(summary = "Mark a Temple as FLAGGED")
    public ResponseEntity<ApiResponse<Void>> flagTemple(@PathVariable Long id, @RequestBody @Valid DcFlagRequest req) {
        dcComplianceService.flagTemple(id, req, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Temple flagged for review."));
    }

    @PostMapping("/trusts/{id}/verify")
    @Operation(summary = "Mark a Trust as VERIFIED")
    public ResponseEntity<ApiResponse<Void>> verifyTrust(@PathVariable Long id,
            @RequestBody @Valid DcVerifyRequest req) {
        dcComplianceService.verifyTrust(id, req, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Trust marked as verified."));
    }

    @PostMapping("/trusts/{id}/flag")
    @Operation(summary = "Mark a Trust as FLAGGED")
    public ResponseEntity<ApiResponse<Void>> flagTrust(@PathVariable Long id, @RequestBody @Valid DcFlagRequest req) {
        dcComplianceService.flagTrust(id, req, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Trust flagged for review."));
    }

    private ScopeHelper.Claims currentClaims() {
        return (ScopeHelper.Claims) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
