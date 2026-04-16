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

    @PostMapping("/employees/{id}/verify")
    @Operation(summary = "Mark an Employee as VERIFIED")
    public ResponseEntity<ApiResponse<Void>> verifyEmployee(@PathVariable Long id,
            @RequestBody @Valid DcVerifyRequest req) {
        dcComplianceService.verifyEmployee(id, req, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Employee marked as verified."));
    }

    @PostMapping("/employees/{id}/flag")
    @Operation(summary = "Mark an Employee as FLAGGED")
    public ResponseEntity<ApiResponse<Void>> flagEmployee(@PathVariable Long id,
            @RequestBody @Valid DcFlagRequest req) {
        dcComplianceService.flagEmployee(id, req, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Employee flagged for review."));
    }

    @PostMapping("/contractors/{id}/verify")
    @Operation(summary = "Mark a Contractor as VERIFIED")
    public ResponseEntity<ApiResponse<Void>> verifyContractor(@PathVariable Long id,
            @RequestBody @Valid DcVerifyRequest req) {
        dcComplianceService.verifyContractor(id, req, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Contractor marked as verified."));
    }

    @PostMapping("/contractors/{id}/flag")
    @Operation(summary = "Mark a Contractor as FLAGGED")
    public ResponseEntity<ApiResponse<Void>> flagContractor(@PathVariable Long id,
            @RequestBody @Valid DcFlagRequest req) {
        dcComplianceService.flagContractor(id, req, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Contractor flagged for review."));
    }

    private ScopeHelper.Claims currentClaims() {
        return (ScopeHelper.Claims) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
