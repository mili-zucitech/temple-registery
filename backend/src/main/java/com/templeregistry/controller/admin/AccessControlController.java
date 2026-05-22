package com.templeregistry.controller.admin;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.accesscontrol.BatchPolicyUpdateRequest;
import com.templeregistry.dto.request.accesscontrol.CreateFieldMaskRequest;
import com.templeregistry.dto.request.accesscontrol.CreatePolicyRequest;
import com.templeregistry.dto.request.accesscontrol.UpdatePolicyRequest;
import com.templeregistry.dto.response.accesscontrol.FieldMaskResponse;
import com.templeregistry.dto.response.accesscontrol.PolicyAuditLogResponse;
import com.templeregistry.dto.response.accesscontrol.PolicyMatrixResponse;
import com.templeregistry.dto.response.accesscontrol.PolicyResponse;
import com.templeregistry.entity.accesscontrol.AccessControlAuditLog;
import com.templeregistry.repository.accesscontrol.AccessControlAuditLogRepository;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.service.accesscontrol.PolicyManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/access-control")
@RequiredArgsConstructor
@Tag(name = "Access Control", description = "SUPER_ADMIN: Dynamic visibility and access policy management")
@PreAuthorize(RoleConstants.ADMIN_ONLY)
public class AccessControlController {

    private final PolicyManagementService policyManagementService;
    private final AccessControlAuditLogRepository auditLogRepository;

    // ─── Policies ─────────────────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "List all access control policies (paginated)")
    public ResponseEntity<ApiResponse<PaginatedResponse<PolicyResponse>>> listPolicies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var result = policyManagementService.listPolicies(
                PageRequest.of(page, size, Sort.by("targetKey").ascending()));
        return ResponseEntity.ok(ApiResponse.success("Policies retrieved.",
                PaginatedResponse.of(result)));
    }

    @PostMapping
    @Operation(summary = "Create a new access control policy")
    public ResponseEntity<ApiResponse<PolicyResponse>> createPolicy(
            @Valid @RequestBody CreatePolicyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Policy created.", policyManagementService.createPolicy(request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing policy's effect or active state")
    public ResponseEntity<ApiResponse<PolicyResponse>> updatePolicy(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePolicyRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Policy updated.",
                policyManagementService.updatePolicy(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete a policy")
    public ResponseEntity<ApiResponse<Void>> deletePolicy(@PathVariable Long id) {
        policyManagementService.deletePolicy(id);
        return ResponseEntity.ok(ApiResponse.success("Policy deleted."));
    }

    @PostMapping("/batch")
    @Operation(summary = "Batch create-or-update policies (used by the permission matrix UI)")
    public ResponseEntity<ApiResponse<List<PolicyResponse>>> batchUpdate(
            @Valid @RequestBody BatchPolicyUpdateRequest request) {
        // Flatten batch items into CreatePolicyRequest list
        List<CreatePolicyRequest> items = request.getUpdates().stream()
                .map(BatchPolicyUpdateRequest.BatchPolicyItem::getPolicy)
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Batch update applied.",
                policyManagementService.batchUpsertPolicies(items)));
    }

    @GetMapping("/matrix")
    @Operation(summary = "Get the full role × target-key permission matrix")
    public ResponseEntity<ApiResponse<PolicyMatrixResponse>> getMatrix() {
        return ResponseEntity.ok(ApiResponse.success("Matrix retrieved.",
                policyManagementService.getPolicyMatrix()));
    }

    // ─── Audit log ────────────────────────────────────────────────────────────

    @GetMapping("/audit")
    @Operation(summary = "List policy change audit log (paginated, newest first)")
    public ResponseEntity<ApiResponse<PaginatedResponse<PolicyAuditLogResponse>>> getAuditLog(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var result = auditLogRepository.findAllByOrderByChangedAtDesc(
                PageRequest.of(page, Math.min(size, 100)));
        return ResponseEntity.ok(ApiResponse.success("Audit log retrieved.",
                PaginatedResponse.of(result.map(this::toAuditResponse))));
    }

    // ─── Field masks ──────────────────────────────────────────────────────────

    @GetMapping("/field-masks")
    @Operation(summary = "List all field masking configurations (paginated)")
    public ResponseEntity<ApiResponse<PaginatedResponse<FieldMaskResponse>>> listFieldMasks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var result = policyManagementService.listFieldMasks(
                PageRequest.of(page, size, Sort.by("fieldKey").ascending()));
        return ResponseEntity.ok(ApiResponse.success("Field masks retrieved.",
                PaginatedResponse.of(result)));
    }

    @PostMapping("/field-masks")
    @Operation(summary = "Create or update a field masking configuration")
    public ResponseEntity<ApiResponse<FieldMaskResponse>> createOrUpdateFieldMask(
            @Valid @RequestBody CreateFieldMaskRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Field mask saved.",
                policyManagementService.createOrUpdateFieldMask(request)));
    }

    @DeleteMapping("/field-masks/{id}")
    @Operation(summary = "Delete a field mask")
    public ResponseEntity<ApiResponse<Void>> deleteFieldMask(@PathVariable Long id) {
        policyManagementService.deleteFieldMask(id);
        return ResponseEntity.ok(ApiResponse.success("Field mask deleted."));
    }

    // ─── helpers ──────────────────────────────────────────────────────────────

    private PolicyAuditLogResponse toAuditResponse(AccessControlAuditLog log) {
        return PolicyAuditLogResponse.builder()
                .id(log.getId())
                .policyId(log.getPolicyId())
                .fieldMaskId(log.getFieldMaskId())
                .changedByUserId(log.getChangedByUserId())
                .changeType(log.getChangeType().name())
                .oldValue(log.getOldValue())
                .newValue(log.getNewValue())
                .changedAt(log.getChangedAt())
                .ipAddress(log.getIpAddress())
                .build();
    }
}
