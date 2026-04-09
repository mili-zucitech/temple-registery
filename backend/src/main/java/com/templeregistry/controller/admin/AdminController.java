package com.templeregistry.controller.admin;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.admin.CreateUserRequest;
import com.templeregistry.dto.request.admin.UpdateUserRequest;
import com.templeregistry.dto.response.admin.UserAdminResponse;
import com.templeregistry.repository.audit.AuditAuthEventRepository;
import com.templeregistry.repository.audit.AuditDataEventRepository;
import com.templeregistry.service.admin.AdminService;
import com.templeregistry.util.PaginationUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Super-admin: user management, audit logs, search summary rebuild")
public class AdminController {

    private final AdminService adminService;
    private final AuditDataEventRepository dataEventRepo;
    private final AuditAuthEventRepository authEventRepo;
    private final PaginationUtil paginationUtil;

    /* ───── Users ───── */

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<PaginatedResponse<UserAdminResponse>>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Users retrieved.", adminService.listUsers(page, size)));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserAdminResponse>> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("User retrieved.", adminService.getUserById(id)));
    }

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<UserAdminResponse>> createUser(@Valid @RequestBody CreateUserRequest rq) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User created.", adminService.createUser(rq)));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserAdminResponse>> updateUser(
            @PathVariable Long id, @Valid @RequestBody UpdateUserRequest rq) {
        return ResponseEntity.ok(ApiResponse.success("User updated.", adminService.updateUser(id, rq)));
    }

    @PostMapping("/users/{id}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable Long id) {
        adminService.deactivateUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deactivated."));
    }

    @PostMapping("/users/{id}/activate")
    public ResponseEntity<ApiResponse<Void>> activate(@PathVariable Long id) {
        adminService.activateUser(id);
        return ResponseEntity.ok(ApiResponse.success("User activated."));
    }

    /* ───── Audit logs ───── */

    @GetMapping("/audit-events")
    @Operation(summary = "Paginated data mutation audit log (SA only)")
    public ResponseEntity<ApiResponse<?>> listAuditEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        var result = dataEventRepo.findAll(PageRequest.of(page, paginationUtil.clampSize(size)));
        return ResponseEntity.ok(ApiResponse.success("Audit events retrieved.", PaginatedResponse.of(result)));
    }

    @GetMapping("/auth-events")
    @Operation(summary = "Paginated authentication audit log (SA only)")
    public ResponseEntity<ApiResponse<?>> listAuthEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        var result = authEventRepo.findAllByOrderByOccurredAtDesc(PageRequest.of(page, paginationUtil.clampSize(size)));
        return ResponseEntity.ok(ApiResponse.success("Auth events retrieved.", PaginatedResponse.of(result)));
    }

    /* ───── Search summary ───── */

    @PostMapping("/search-summary/rebuild")
    @Operation(summary = "Trigger async rebuild of temple_search_summary table")
    public ResponseEntity<ApiResponse<Void>> rebuildSearchSummary() {
        adminService.rebuildSearchSummary();
        return ResponseEntity.accepted().body(ApiResponse.success("Search summary rebuild queued."));
    }
}
