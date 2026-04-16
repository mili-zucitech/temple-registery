package com.templeregistry.controller.ta;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.dto.request.ta.TaDocumentMetadataRequest;
import com.templeregistry.dto.request.ta.TaProfileStagingRequest;
import com.templeregistry.dto.response.ta.TaActivityResponse;
import com.templeregistry.dto.response.ta.TaCurrentProfileResponse;
import com.templeregistry.dto.response.ta.TaDashboardResponse;
import com.templeregistry.dto.response.ta.TaDocumentResponse;
import com.templeregistry.dto.response.ta.TaProfileStatusResponse;
import com.templeregistry.dto.response.temple.TempleProfileStagingResponse;
import com.templeregistry.dto.response.temple.TempleResponse;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.ta.TaDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ta")
@RequiredArgsConstructor
@Tag(name = "Temple Authority Dashboard", description = "Self-service APIs for Temple Authority users")
public class TaDashboardController {

    private final TaDashboardService taDashboardService;

    // ─── Dashboard ─────────────────────────────────────────────────────────────

    @GetMapping("/dashboard")
    @Operation(summary = "Get TA dashboard summary",
               description = "Returns temple identity, profile workflow status, and pending actions for the logged-in Temple Authority")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Dashboard data returned"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied — TEMPLE_AUTHORITY role required")
    })
    public ResponseEntity<ApiResponse<TaDashboardResponse>> getDashboard() {
        TaDashboardResponse data = taDashboardService.getDashboard(claims());
        return ResponseEntity.ok(ApiResponse.success("Dashboard loaded", data));
    }

    // ─── Temple master ────────────────────────────────────────────────────────

    @GetMapping("/temple")
    @Operation(summary = "Get own temple details",
               description = "Fetches the master temple record for the logged-in Temple Authority. Read-only.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Temple details returned"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Temple not found")
    })
    public ResponseEntity<ApiResponse<TempleResponse>> getTemple() {
        TempleResponse data = taDashboardService.getTemple(claims());
        return ResponseEntity.ok(ApiResponse.success("Temple details loaded", data));
    }

    // ─── Current approved profile ─────────────────────────────────────────────

    @GetMapping("/profile/current")
    @Operation(summary = "Get currently approved temple profile",
               description = "Returns the live approved profile (temple_profile_current). Returns null data if no approved profile exists yet.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Current profile returned (data may be null if not yet approved)")
    })
    public ResponseEntity<ApiResponse<TaCurrentProfileResponse>> getCurrentProfile() {
        TaCurrentProfileResponse data = taDashboardService.getCurrentProfile(claims());
        return ResponseEntity.ok(ApiResponse.success("Current profile loaded", data));
    }

    // ─── Active staging profile ───────────────────────────────────────────────

    @GetMapping("/profile/staging")
    @Operation(summary = "Get active staging profile",
               description = "Returns DRAFT or SUBMITTED (PENDING_REVIEW) staging record. Returns null data if none exists.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Active staging profile returned (data may be null)")
    })
    public ResponseEntity<ApiResponse<TempleProfileStagingResponse>> getActiveStagingProfile() {
        TempleProfileStagingResponse data = taDashboardService.getActiveStagingProfile(claims());
        return ResponseEntity.ok(ApiResponse.success("Active staging profile loaded", data));
    }

    // ─── Create / update staging ──────────────────────────────────────────────

    @PostMapping("/profile")
    @Operation(summary = "Create or update profile staging draft",
               description = "Creates a new DRAFT or patches an existing one using patch semantics (null fields are ignored). Returns 422 if a SUBMITTED profile is under DC review.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Staging draft saved"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "422", description = "Profile is under DC review — editing is locked (EC-04)")
    })
    public ResponseEntity<ApiResponse<TempleProfileStagingResponse>> createOrUpdateProfile(
            @Valid @RequestBody TaProfileStagingRequest request) {
        TempleProfileStagingResponse data = taDashboardService.createOrUpdateStagingProfile(claims(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile draft saved", data));
    }

    // ─── Submit profile ────────────────────────────────────────────────────────

    @PostMapping("/profile/submit")
    @Operation(summary = "Submit staging profile for DC review",
               description = "Transitions the DRAFT staging record to SUBMITTED. Notifies the District Collector.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Profile submitted for DC review"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "No DRAFT profile found to submit")
    })
    public ResponseEntity<ApiResponse<TempleProfileStagingResponse>> submitProfile() {
        TempleProfileStagingResponse data = taDashboardService.submitProfile(claims());
        return ResponseEntity.ok(ApiResponse.success("Profile submitted for DC review", data));
    }

    // ─── Profile status ────────────────────────────────────────────────────────

    @GetMapping("/profile/status")
    @Operation(summary = "Get profile workflow status",
               description = "Returns the current status label (NOT_CREATED, DRAFT, SUBMITTED, APPROVED, REJECTED) and review comment if rejected.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Profile status returned")
    })
    public ResponseEntity<ApiResponse<TaProfileStatusResponse>> getProfileStatus() {
        TaProfileStatusResponse data = taDashboardService.getProfileStatus(claims());
        return ResponseEntity.ok(ApiResponse.success("Profile status loaded", data));
    }

    // ─── Document registration ────────────────────────────────────────────────

    @PostMapping("/documents")
    @Operation(summary = "Register an uploaded document",
               description = "Registers metadata for a file the TA has already uploaded to S3. Server validates MIME type and file size.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Document metadata registered"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error or unsupported file type")
    })
    public ResponseEntity<ApiResponse<TaDocumentResponse>> registerDocument(
            @Valid @RequestBody TaDocumentMetadataRequest request) {
        TaDocumentResponse data = taDashboardService.registerDocument(claims(), request);
        return ResponseEntity.ok(ApiResponse.success("Document registered", data));
    }

    // ─── Activity summary ─────────────────────────────────────────────────────

    @GetMapping("/activity")
    @Operation(summary = "Get profile activity summary",
               description = "Returns last profile update, last submission, and last DC review timestamps.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Activity summary returned")
    })
    public ResponseEntity<ApiResponse<TaActivityResponse>> getActivitySummary() {
        TaActivityResponse data = taDashboardService.getActivitySummary(claims());
        return ResponseEntity.ok(ApiResponse.success("Activity summary loaded", data));
    }

    // ─── Helper ────────────────────────────────────────────────────────────────

    private ScopeHelper.Claims claims() {
        return (ScopeHelper.Claims) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
