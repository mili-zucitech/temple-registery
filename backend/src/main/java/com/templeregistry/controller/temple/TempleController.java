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
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/temples")
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

    @PostMapping(value = "/{id}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a single primary temple photo")
    public ResponseEntity<ApiResponse<String>> uploadTemplePhoto(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Temple photo uploaded.", templeService.uploadPrimaryPhoto(id, file)));
    }

    @PostMapping(value = "/{id}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload one or more temple gallery photos")
    public ResponseEntity<ApiResponse<List<String>>> uploadTemplePhotos(
            @PathVariable Long id,
            @RequestPart("files") List<MultipartFile> files) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Temple photos uploaded.", templeService.uploadTemplePhotos(id, files)));
    }

    @GetMapping("/{id}/photos")
    @Operation(summary = "Get ordered temple gallery photos")
    public ResponseEntity<ApiResponse<List<TemplePhotoDto>>> getTemplePhotos(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Temple photos retrieved.", templeService.getTemplePhotos(id)));
    }

    @DeleteMapping("/{templeId}/photos/{photoId}")
    @Operation(summary = "Delete a temple gallery photo")
    public ResponseEntity<ApiResponse<Void>> deleteTemplePhoto(
            @PathVariable Long templeId,
            @PathVariable Long photoId) {
        templeService.deleteTemplePhoto(templeId, photoId);
        return ResponseEntity.ok(ApiResponse.success("Temple photo deleted.", null));
    }

    /* â”€â”€ Temple Profile Staging Workflow (TA â†’ DC approval) â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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
        /**
         * Returns the current approved temple profile (main table, not staging).
         */
        @GetMapping("/{templeId}/profile/current")
        @Operation(summary = "Get the current approved temple profile (registration contact details)")
        public ResponseEntity<ApiResponse<TempleResponse>> getCurrentProfile(@PathVariable Long templeId) {
                TempleResponse response = templeService.getCurrentProfile(templeId);
                return ResponseEntity.ok(ApiResponse.success("Current temple profile retrieved.", response));
        }
}

