package com.templeregistry.controller.dc;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.dc.ApproveEmployeeRequest;
import com.templeregistry.dto.request.dc.RejectEmployeeRequest;
import com.templeregistry.dto.response.employee.EmployeeResponse;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.employee.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dc/employees")
@RequiredArgsConstructor
@Tag(name = "DC Employees", description = "Employee review and approval for DC portal")
@PreAuthorize(RoleConstants.CAN_READ_ALL)
public class DcEmployeeController {

    private final EmployeeService employeeService;

    @GetMapping("/pending")
    @Operation(summary = "List employees pending review (district-scoped)")
    public ResponseEntity<ApiResponse<PaginatedResponse<EmployeeResponse>>> listPendingReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        ScopeHelper.Claims claims = currentClaims();
        return ResponseEntity.ok(ApiResponse.success("Pending employees retrieved.",
                employeeService.listPendingReviews(claims.districtId(), page, size)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get employee detail (read-only for DC)")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Employee retrieved.",
                employeeService.getById(id)));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize(RoleConstants.IS_DC_ROLE)
    @Operation(summary = "Approve employee record")
    public ResponseEntity<ApiResponse<EmployeeResponse>> approve(
            @PathVariable Long id,
            @Valid @RequestBody ApproveEmployeeRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Employee approved.",
                employeeService.approveEmployee(id, request, currentClaims())));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize(RoleConstants.IS_DC_ROLE)
    @Operation(summary = "Reject employee record")
    public ResponseEntity<ApiResponse<EmployeeResponse>> reject(
            @PathVariable Long id,
            @Valid @RequestBody RejectEmployeeRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Employee rejected.",
                employeeService.rejectEmployee(id, request, currentClaims())));
    }

    private ScopeHelper.Claims currentClaims() {
        return (ScopeHelper.Claims) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
