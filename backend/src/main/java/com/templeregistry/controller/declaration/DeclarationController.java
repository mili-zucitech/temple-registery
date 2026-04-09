package com.templeregistry.controller.declaration;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.declaration.*;
import com.templeregistry.dto.response.declaration.*;
import com.templeregistry.service.declaration.DeclarationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Tag(name = "Declarations", description = "Asset declaration lifecycle: DRAFT → SUBMITTED → APPROVED/REJECTED")
public class DeclarationController {

    private final DeclarationService declarationService;

    @GetMapping("/api/temples/{templeId}/declarations")
    @Operation(summary = "List declarations for a temple (paginated)")
    public ResponseEntity<ApiResponse<PaginatedResponse<DeclarationResponse>>> list(
            @PathVariable Long templeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Declarations retrieved.",
                declarationService.listByTemple(templeId, page, size)));
    }

    @PostMapping("/api/temples/{templeId}/declarations")
    @Operation(summary = "Create a DRAFT declaration")
    public ResponseEntity<ApiResponse<DeclarationResponse>> create(
            @PathVariable Long templeId, @Valid @RequestBody CreateDeclarationRequest rq) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Declaration created.", declarationService.create(templeId, rq)));
    }

    @GetMapping("/api/declarations/{id}")
    public ResponseEntity<ApiResponse<DeclarationResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Declaration retrieved.", declarationService.getById(id)));
    }

    @PutMapping("/api/declarations/{id}")
    @Operation(summary = "Update DRAFT declaration fields")
    public ResponseEntity<ApiResponse<DeclarationResponse>> update(
            @PathVariable Long id, @Valid @RequestBody CreateDeclarationRequest rq) {
        return ResponseEntity.ok(ApiResponse.success("Declaration updated.", declarationService.update(id, rq)));
    }

    @PostMapping("/api/declarations/{id}/submit")
    @Operation(summary = "Submit declaration for DC review (DRAFT → SUBMITTED)")
    public ResponseEntity<ApiResponse<Void>> submit(@PathVariable Long id) {
        declarationService.submit(id);
        return ResponseEntity.ok(ApiResponse.success("Declaration submitted."));
    }

    @PostMapping("/api/declarations/{id}/approve")
    @Operation(summary = "Approve declaration (DC/SA)")
    public ResponseEntity<ApiResponse<Void>> approve(@PathVariable Long id) {
        declarationService.approve(id);
        return ResponseEntity.ok(ApiResponse.success("Declaration approved."));
    }

    @PostMapping("/api/declarations/{id}/reject")
    @Operation(summary = "Reject declaration (DC/SA)")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable Long id, @Valid @RequestBody ClarificationRequest reason) {
        declarationService.reject(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Declaration rejected."));
    }

    @PostMapping("/api/declarations/{id}/clarification")
    @Operation(summary = "Request clarification from temple (DC/SA)")
    public ResponseEntity<ApiResponse<Void>> requestClarification(
            @PathVariable Long id, @Valid @RequestBody ClarificationRequest rq) {
        declarationService.requestClarification(id, rq);
        return ResponseEntity.ok(ApiResponse.success("Clarification requested."));
    }

    @PostMapping("/api/declarations/{id}/flag-physical-verification")
    @Operation(summary = "Flag for physical verification (DC/SA)")
    public ResponseEntity<ApiResponse<Void>> flagPhysical(
            @PathVariable Long id, @Valid @RequestBody FlagPhysicalVerificationRequest rq) {
        declarationService.flagPhysicalVerification(id, rq);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/declarations/{id}/resubmit")
    @Operation(summary = "Resubmit after clarification (TA)")
    public ResponseEntity<ApiResponse<Void>> resubmit(
            @PathVariable Long id, @Valid @RequestBody ResubmitDeclarationRequest rq) {
        declarationService.resubmit(id, rq);
        return ResponseEntity.ok(ApiResponse.success("Declaration resubmitted."));
    }

    @GetMapping("/api/declarations/{id}/acknowledgement")
    @Operation(summary = "Get pre-signed download URL for APPROVED declaration acknowledgement")
    public ResponseEntity<ApiResponse<AcknowledgementResponse>> getAcknowledgement(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Acknowledgement URL generated.",
                declarationService.getAcknowledgement(id)));
    }

    @GetMapping("/api/declarations/{id}/diff")
    @Operation(summary = "Show field-level diff between current submitted values and last approved snapshot")
    public ResponseEntity<ApiResponse<?>> getDiff(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Diff retrieved.", declarationService.getDiff(id)));
    }
}
