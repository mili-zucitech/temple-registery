package com.templeregistry.controller.employee;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.employee.CreateEmployeeRequest;
import com.templeregistry.dto.response.employee.EmployeeResponse;
import com.templeregistry.service.employee.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Tag(name = "Employees", description = "Temple staff / employee management")
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping("/api/temples/{templeId}/employees")
    @Operation(summary = "List employees for a temple (paginated)")
    public ResponseEntity<ApiResponse<PaginatedResponse<EmployeeResponse>>> list(
            @PathVariable Long templeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Employees retrieved.",
                employeeService.listByTemple(templeId, page, size)));
    }

    @PostMapping("/api/temples/{templeId}/employees")
    @Operation(summary = "Add an employee to a temple")
    public ResponseEntity<ApiResponse<EmployeeResponse>> create(
            @PathVariable Long templeId, @Valid @RequestBody CreateEmployeeRequest rq) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Employee created.", employeeService.create(templeId, rq)));
    }

    @GetMapping("/api/employees/{id}")
    @Operation(summary = "Get employee detail")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Employee retrieved.", employeeService.getById(id)));
    }

    @PutMapping("/api/employees/{id}")
    @Operation(summary = "Update employee")
    public ResponseEntity<ApiResponse<EmployeeResponse>> update(
            @PathVariable Long id, @Valid @RequestBody CreateEmployeeRequest rq) {
        return ResponseEntity.ok(ApiResponse.success("Employee updated.", employeeService.update(id, rq)));
    }

    @DeleteMapping("/api/employees/{id}")
    @Operation(summary = "Soft-delete employee")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        employeeService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Employee removed."));
    }
}
