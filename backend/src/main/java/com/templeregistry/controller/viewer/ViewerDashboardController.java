package com.templeregistry.controller.viewer;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.dto.response.viewer.ViewerDashboardResponse;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.service.viewer.ViewerDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/viewer")
@RequiredArgsConstructor
@Tag(name = "Viewer", description = "Read-only dashboard for State Government / Audit Bodies (VIEWER role)")
@PreAuthorize(RoleConstants.CAN_READ_ALL)
public class ViewerDashboardController {

    private final ViewerDashboardService viewerDashboardService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get compliance-oriented KPI dashboard for Viewer (State Government / Audit Bodies)")
    public ResponseEntity<ApiResponse<ViewerDashboardResponse>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success("Viewer dashboard retrieved.",
                viewerDashboardService.getDashboard()));
    }
}
