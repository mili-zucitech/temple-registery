package com.templeregistry.controller.declaration;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.declaration.*;
import com.templeregistry.dto.response.declaration.*;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.declaration.DeclarationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.Resource;

import java.util.List;

@RestController
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Declarations", description = "Asset declaration lifecycle: DRAFT → SUBMITTED → APPROVED/REJECTED")
public class DeclarationController {

    private final DeclarationService declarationService;

    @GetMapping("/api/v1/temples/{templeId}/declarations")
    @Operation(summary = "List declarations for a temple (paginated)")
    public ResponseEntity<ApiResponse<PaginatedResponse<DeclarationResponse>>> list(
            @PathVariable Long templeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Declarations retrieved.",
                declarationService.listByTemple(templeId, page, size)));
    }

    @PostMapping("/api/v1/temples/{templeId}/declarations")
    @Operation(summary = "Create a DRAFT declaration")
    public ResponseEntity<ApiResponse<CompleteDeclarationResponse>> create(
            @PathVariable Long templeId, @Valid @RequestBody CreateDeclarationRequest rq) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Declaration created.", declarationService.create(templeId, rq)));
    }

    @GetMapping("/api/v1/declarations/{id}")
    public ResponseEntity<ApiResponse<CompleteDeclarationResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Declaration retrieved.", declarationService.getById(id)));
    }

    @PutMapping("/api/v1/declarations/{id}")
    @Operation(summary = "Update DRAFT declaration fields")
    public ResponseEntity<ApiResponse<CompleteDeclarationResponse>> update(
            @PathVariable Long id, @Valid @RequestBody CreateDeclarationRequest rq) {
        return ResponseEntity.ok(ApiResponse.success("Declaration updated.", declarationService.update(id, rq)));
    }

    /**
     * @deprecated Use POST /api/v1/governance/declarations/{id}/submit instead.
     * This endpoint is removed to prevent dual-path workflow mutation.
     * DeclarationController handles CRUD only. GovernanceWorkflowController handles workflow.
     */
    @Deprecated(forRemoval = true)
    @PostMapping("/api/v1/declarations/{id}/submit")
    @Operation(summary = "[DEPRECATED] Use /api/v1/governance/declarations/{id}/submit",
               description = "This endpoint is deprecated. Use the governance workflow endpoint instead.")
    public ResponseEntity<ApiResponse<Void>> submit(@PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.GONE)
            .body(ApiResponse.error("This endpoint is deprecated. Use POST /api/v1/governance/declarations/" + id + "/submit", "ENDPOINT_DEPRECATED"));
    }

    @PostMapping("/api/v1/declarations/{id}/clarification-respond")
    @Operation(summary = "Respond to clarification request (TA) — CLARIFICATION_REQUIRED → CLARIFICATION_RESPONDED")
    @PreAuthorize(RoleConstants.TEMPLE_AUTHORITY_ONLY)
    public ResponseEntity<ApiResponse<Void>> respondToClarification(
            @PathVariable Long id, @Valid @RequestBody ClarificationRespondRequest rq) {
        ScopeHelper.Claims claims = currentClaims();
        declarationService.respondToClarification(id, rq, claims.userId(), claims.role());
        return ResponseEntity.ok(ApiResponse.success("Clarification response submitted."));
    }

    @GetMapping("/api/v1/declarations/{id}/acknowledgement")
    @Operation(summary = "Get pre-signed download URL for APPROVED declaration acknowledgement")
    public ResponseEntity<ApiResponse<AcknowledgementResponse>> getAcknowledgement(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Acknowledgement URL generated.",
                declarationService.getAcknowledgement(id)));
    }

    @GetMapping("/api/v1/declarations/{id}/acknowledgement/download")
    @Operation(summary = "Download APPROVED declaration acknowledgement PDF")
    public ResponseEntity<Resource> downloadAcknowledgement(@PathVariable Long id) {
        Resource resource = declarationService.downloadAcknowledgement(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"ACK_DECLARATION_" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(resource);
    }

    @GetMapping("/api/v1/declarations/{id}/diff")
    @Operation(summary = "Show field-level diff between current submitted values and last approved snapshot")
    public ResponseEntity<ApiResponse<?>> getDiff(
            @PathVariable Long id,
            @RequestParam(required = false) Integer compareToVersion) {
        return ResponseEntity.ok(ApiResponse.success("Diff retrieved.", declarationService.getDiff(id, compareToVersion)));
    }

    @GetMapping("/api/v1/declarations/{id}/clarifications")
    @Operation(summary = "Get clarification thread for a declaration (DC/TA)")
    public ResponseEntity<ApiResponse<?>> listClarifications(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Clarifications retrieved.", declarationService.listClarifications(id)));
    }

    @GetMapping("/api/v1/declarations/{id}/versions")
    @Operation(summary = "Get the submission version history for a declaration")
    public ResponseEntity<ApiResponse<?>> listVersions(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Versions retrieved.", declarationService.listVersions(id)));
    }

    @GetMapping("/api/v1/declarations/{id}/audit")
    @Operation(summary = "Get audit trail for a declaration (all authenticated roles)")
    public ResponseEntity<ApiResponse<List<AuditLogEntry>>> getAuditLog(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Audit log retrieved.",
                declarationService.listAuditLog(id)));
    }

    @GetMapping("/api/v1/declarations/overdue")
    @Operation(summary = "DC: List overdue declarations for a district (paginated)")
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public ResponseEntity<ApiResponse<PaginatedResponse<DeclarationResponse>>> listOverdue(
            @RequestParam Long districtId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Overdue declarations retrieved.",
                declarationService.listOverdue(districtId, page, size)));
    }

    private ScopeHelper.Claims currentClaims() {
        return (ScopeHelper.Claims) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
