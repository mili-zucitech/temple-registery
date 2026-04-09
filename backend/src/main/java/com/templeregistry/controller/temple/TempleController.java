package com.templeregistry.controller.temple;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.temple.*;
import com.templeregistry.dto.response.temple.*;
import com.templeregistry.service.temple.TempleProfileStagingService;
import com.templeregistry.service.temple.TempleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/temples")
@RequiredArgsConstructor
@Tag(name = "Temples", description = "Temple search, profile staging workflow, and SA-only direct CRUD")
public class TempleController {

    private final TempleService templeService;
    private final TempleProfileStagingService stagingService;

    @GetMapping
    @Operation(summary = "Search temples with geo + grade + keyword filters (paginated)")
    public ResponseEntity<ApiResponse<PaginatedResponse<TempleSearchResultResponse>>> search(
            TempleSearchFilterRequest filter) {
        return ResponseEntity.ok(ApiResponse.success("Temples retrieved.", templeService.search(filter)));
    }

    @PostMapping
    @Operation(summary = "Create a new temple (SUPER_ADMIN only)")
    public ResponseEntity<ApiResponse<TempleResponse>> create(
            @Valid @RequestBody CreateTempleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Temple created.", templeService.create(request)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get temple detail by ID")
    public ResponseEntity<ApiResponse<TempleResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Temple retrieved.", templeService.getById(id)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Direct-update temple core fields (SUPER_ADMIN only). TAs use /profile/staging.")
    public ResponseEntity<ApiResponse<TempleResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTempleRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Temple updated.", templeService.update(id, request)));
    }

    /* ── Temple Profile Staging Workflow (TA → DC approval) ───────── */

    @PostMapping("/{templeId}/profile/staging")
    @Operation(summary = "Create or update a DRAFT profile staging record (TA/SA)")
    public ResponseEntity<ApiResponse<TempleProfileStagingResponse>> createOrUpdateDraft(
            @PathVariable Long templeId,
            @Valid @RequestBody CreateTempleProfileStagingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Profile draft saved.",
                        stagingService.createOrUpdateDraft(templeId, request)));
    }

    @PostMapping("/{templeId}/profile/submit")
    @Operation(summary = "Submit the current DRAFT profile for DC review (TA)")
    public ResponseEntity<ApiResponse<TempleProfileStagingResponse>> submitForReview(
            @PathVariable Long templeId) {
        return ResponseEntity.ok(ApiResponse.success("Profile submitted for review.",
                stagingService.submitForReview(templeId)));
    }

    @PostMapping("/{templeId}/profile/approve/{stagingId}")
    @Operation(summary = "Approve a SUBMITTED profile staging record (DC/SA)")
    public ResponseEntity<ApiResponse<TempleProfileStagingResponse>> approve(
            @PathVariable Long templeId, @PathVariable Long stagingId) {
        return ResponseEntity.ok(ApiResponse.success("Profile approved.",
                stagingService.approve(templeId, stagingId)));
    }

    @PostMapping("/{templeId}/profile/reject/{stagingId}")
    @Operation(summary = "Reject a SUBMITTED profile staging record with a comment (DC/SA)")
    public ResponseEntity<ApiResponse<TempleProfileStagingResponse>> reject(
            @PathVariable Long templeId,
            @PathVariable Long stagingId,
            @RequestParam String dcComment) {
        return ResponseEntity.ok(ApiResponse.success("Profile rejected.",
                stagingService.reject(templeId, stagingId, dcComment)));
    }

    @GetMapping("/{templeId}/profile/staging/active")
    @Operation(summary = "Get the active (DRAFT or SUBMITTED) staging record, or null if none")
    public ResponseEntity<ApiResponse<TempleProfileStagingResponse>> getActiveStaging(
            @PathVariable Long templeId) {
        return ResponseEntity.ok(ApiResponse.success("Active staging retrieved.",
                stagingService.getActiveStagingOrNull(templeId)));
    }

    @GetMapping("/{templeId}/profile/history")
    @Operation(summary = "Paginated history of all profile staging versions (most recent first)")
    public ResponseEntity<ApiResponse<PaginatedResponse<TempleProfileStagingResponse>>> getHistory(
            @PathVariable Long templeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Profile history retrieved.",
                stagingService.getHistory(templeId, page, size)));
    }
}

