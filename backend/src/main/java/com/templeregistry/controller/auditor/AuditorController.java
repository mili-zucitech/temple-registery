package com.templeregistry.controller.auditor;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.dto.response.auditor.AuditTrailEntry;
import com.templeregistry.dto.response.auditor.ComplianceAnomalyResponse;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.service.auditor.AuditorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/auditor")
@RequiredArgsConstructor
@Tag(name = "Auditor", description = "Compliance and audit trail endpoints for AUDITOR/SUPER_ADMIN")
@PreAuthorize(RoleConstants.CAN_READ_ALL)
public class AuditorController {

    private final AuditorService auditorService;

    @GetMapping("/compliance")
    @Operation(summary = "Get statewide compliance anomaly report")
    public ResponseEntity<ApiResponse<List<ComplianceAnomalyResponse>>> complianceReport() {
        return ResponseEntity.ok(ApiResponse.success("Compliance report generated.",
                auditorService.getComplianceReport()));
    }

    @GetMapping("/audit-trail/{entityType}/{entityId}")
    @Operation(summary = "Combined audit trail for any entity (governance + data events)")
    public ResponseEntity<ApiResponse<List<AuditTrailEntry>>> auditTrail(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.success("Audit trail retrieved.",
                auditorService.getAuditTrail(entityType, entityId, page, size)));
    }
}

