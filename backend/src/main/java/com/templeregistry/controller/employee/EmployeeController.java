package com.templeregistry.controller.employee;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.employee.CreateEmployeeRequest;
import com.templeregistry.dto.request.employee.SubmitEmployeeRequest;
import com.templeregistry.dto.request.employee.UpdateEmployeeRequest;
import com.templeregistry.dto.response.employee.EmployeeResponse;
import com.templeregistry.service.employee.EmployeeService;
import com.templeregistry.security.RoleConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Tag(name = "Employees", description = "Temple staff / employee management")
@RequestMapping("/api/v1")
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping("/temples/{templeId}/employees")
    @Operation(summary = "List employees for a temple (paginated)")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PaginatedResponse<EmployeeResponse>>> list(
            @PathVariable Long templeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Employees retrieved.",
                employeeService.listByTemple(templeId, page, size)));
    }

    @PostMapping("/temples/{templeId}/employees")
    @Operation(summary = "Add an employee to a temple")
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public ResponseEntity<ApiResponse<EmployeeResponse>> create(
            @PathVariable Long templeId, @Valid @RequestBody CreateEmployeeRequest rq) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Employee created.", employeeService.create(templeId, rq)));
    }

    @GetMapping("/employees/{id}")
    @Operation(summary = "Get employee detail")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Employee retrieved.", employeeService.getById(id)));
    }

    @PutMapping("/employees/{id}")
    @Operation(summary = "Update employee record or transition status (supports RESIGNED, RETIRED, ON_LEAVE)")
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public ResponseEntity<ApiResponse<EmployeeResponse>> update(
            @PathVariable Long id, @Valid @RequestBody UpdateEmployeeRequest rq) {
        return ResponseEntity.ok(ApiResponse.success("Employee updated.", employeeService.update(id, rq)));
    }

    @DeleteMapping("/employees/{id}")
    @Operation(summary = "Soft-delete employee (SUPER_ADMIN only)")
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        employeeService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Employee removed."));
    }

    @PostMapping("/employees/{id}/submit")
    @Operation(summary = "Submit employee record for DC review")
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public ResponseEntity<ApiResponse<EmployeeResponse>> submitForReview(
            @PathVariable Long id,
            @Valid @RequestBody SubmitEmployeeRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Employee submitted for review.",
                employeeService.submitForReview(id, request)));
    }

    @PostMapping("/employees/{id}/withdraw")
    @Operation(summary = "Withdraw submission (return to DRAFT)")
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public ResponseEntity<ApiResponse<EmployeeResponse>> withdrawSubmission(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Submission withdrawn.",
                employeeService.withdrawSubmission(id)));
    }
}
