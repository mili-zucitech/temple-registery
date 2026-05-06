package com.templeregistry.controller.observation;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.observation.CloseObservationRequest;
import com.templeregistry.dto.request.observation.CreateObservationRequest;
import com.templeregistry.dto.response.observation.ObservationResponse;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.observation.ObservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/observations")
@RequiredArgsConstructor
@Tag(name = "Observations", description = "AUDITOR: raise and manage compliance observations")
@PreAuthorize(RoleConstants.CAN_READ_ALL)
public class ObservationController {

    private final ObservationService observationService;

    @GetMapping
    @Operation(summary = "List observations (filterable by status)")
    public ResponseEntity<ApiResponse<PaginatedResponse<ObservationResponse>>> list(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PaginatedResponse<ObservationResponse> result = status != null
                ? observationService.listByStatus(status, page, size)
                : observationService.listAll(page, size);
        return ResponseEntity.ok(ApiResponse.success("Observations retrieved.", result));
    }

    @GetMapping("/temple/{templeId}")
    @Operation(summary = "List observations for a specific temple")
    public ResponseEntity<ApiResponse<PaginatedResponse<ObservationResponse>>> listByTemple(
            @PathVariable Long templeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Observations retrieved.",
                observationService.listByTemple(templeId, page, size)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get observation detail")
    public ResponseEntity<ApiResponse<ObservationResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Observation retrieved.", observationService.getById(id)));
    }

    @PostMapping
    @PreAuthorize(RoleConstants.CAN_RAISE_OBSERVATION)
    @Operation(summary = "Create a new observation (AUDITOR or SUPER_ADMIN — the only write permission granted to AUDITOR)")
    public ResponseEntity<ApiResponse<ObservationResponse>> create(
            @Valid @RequestBody CreateObservationRequest rq) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Observation created.", observationService.create(rq, currentUserId())));
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Operation(summary = "Assign observation to a user (SUPER_ADMIN only)")
    public ResponseEntity<ApiResponse<ObservationResponse>> assign(
            @PathVariable Long id,
            @RequestParam Long assignedToUserId) {
        return ResponseEntity.ok(ApiResponse.success("Observation assigned.", observationService.assignObservation(id, assignedToUserId)));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Operation(summary = "Close an observation with resolution note (SUPER_ADMIN only)")
    public ResponseEntity<ApiResponse<ObservationResponse>> close(
            @PathVariable Long id,
            @Valid @RequestBody CloseObservationRequest rq) {
        return ResponseEntity.ok(ApiResponse.success("Observation closed.", observationService.closeObservation(id, rq)));
    }

    private Long currentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof ScopeHelper.Claims c) {
            return c.userId();
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated principal not resolved");
    }
}
