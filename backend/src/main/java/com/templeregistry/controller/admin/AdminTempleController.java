package com.templeregistry.controller.admin;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.dto.request.admin.TempleStatusChangeRequest;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.temple.TempleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/temples")
@RequiredArgsConstructor
@Tag(name = "Admin Temple Governance", description = "SUPER_ADMIN: temple lifecycle management (suspend, freeze, reactivate, archive)")
@PreAuthorize(RoleConstants.ADMIN_ONLY)
public class AdminTempleController {

    private final TempleService templeService;

    @PostMapping("/{id}/suspend")
    @Operation(summary = "Suspend a temple — blocks TA writes and DC declaration actions")
    public ResponseEntity<ApiResponse<Void>> suspendTemple(
            @PathVariable Long id,
            @Valid @RequestBody TempleStatusChangeRequest rq) {
        templeService.suspendTemple(id, rq.getReason(), currentUserId());
        return ResponseEntity.ok(ApiResponse.success("Temple suspended."));
    }

    @PostMapping("/{id}/reactivate")
    @Operation(summary = "Reactivate a suspended or frozen temple")
    public ResponseEntity<ApiResponse<Void>> reactivateTemple(
            @PathVariable Long id,
            @Valid @RequestBody TempleStatusChangeRequest rq) {
        templeService.reactivateTemple(id, rq.getReason(), currentUserId());
        return ResponseEntity.ok(ApiResponse.success("Temple reactivated."));
    }

    @PostMapping("/{id}/freeze")
    @Operation(summary = "Freeze a temple — blocks new declarations while under review")
    public ResponseEntity<ApiResponse<Void>> freezeTemple(
            @PathVariable Long id,
            @Valid @RequestBody TempleStatusChangeRequest rq) {
        templeService.freezeTemple(id, rq.getReason(), currentUserId());
        return ResponseEntity.ok(ApiResponse.success("Temple frozen."));
    }

    @PostMapping("/{id}/archive")
    @Operation(summary = "Archive a temple — terminal status, no further actions allowed")
    public ResponseEntity<ApiResponse<Void>> archiveTemple(
            @PathVariable Long id,
            @Valid @RequestBody TempleStatusChangeRequest rq) {
        templeService.archiveTemple(id, rq.getReason(), currentUserId());
        return ResponseEntity.ok(ApiResponse.success("Temple archived."));
    }

    private Long currentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return principal instanceof ScopeHelper.Claims c ? c.userId() : 0L;
    }
}
