package com.templeregistry.controller.dc;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.dto.response.dc.DcDashboardResponse;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.dc.DcDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dc")
@RequiredArgsConstructor
@Tag(name = "DC Dashboard", description = "District Collector dashboard KPIs")
@PreAuthorize(RoleConstants.IS_DC_ROLE)
public class DcDashboardController {

    private final DcDashboardService dcDashboardService;

    @GetMapping("/dashboard")
    @Operation(summary = "Returns aggregate KPI metrics for the DC dashboard. District-scoped for DC roles; all-district view for SUPER_ADMIN.")
    public ResponseEntity<ApiResponse<DcDashboardResponse>> getDashboard() {
        DcDashboardResponse dashboard = dcDashboardService.getDashboard(currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Dashboard data retrieved.", dashboard));
    }

    private ScopeHelper.Claims currentClaims() {
        return (ScopeHelper.Claims) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
