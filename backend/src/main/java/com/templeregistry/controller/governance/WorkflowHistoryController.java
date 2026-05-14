package com.templeregistry.controller.governance;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.dto.response.governance.EntityVersionResponse;
import com.templeregistry.dto.response.governance.WorkflowHistoryResponse;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.service.governance.WorkflowHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Workflow History API — provides timeline view of all state transitions.
 * Powers the WorkflowGovernancePanel timeline component.
 */
@RestController
@RequestMapping("/api/v2/workflow")
@RequiredArgsConstructor
@Tag(name = "Workflow History", description = "Workflow transition history and audit trail")
public class WorkflowHistoryController {

    private final WorkflowHistoryService historyService;

    @GetMapping("/{workflowInstanceId}/history")
    @PreAuthorize(RoleConstants.CAN_READ_ALL)
    @Operation(summary = "Get workflow transition history",
               description = "Returns chronological list of all state transitions for a workflow instance")
    public ApiResponse<List<WorkflowHistoryResponse>> getHistory(
            @PathVariable Long workflowInstanceId) {
        return ApiResponse.success("Workflow history retrieved successfully", historyService.getHistory(workflowInstanceId));
    }

    @GetMapping("/{workflowInstanceId}/history/summary")
    @PreAuthorize(RoleConstants.CAN_READ_ALL)
    @Operation(summary = "Get workflow history summary",
               description = "Returns condensed summary for API envelope")
    public ApiResponse<WorkflowHistoryResponse.Summary> getHistorySummary(
            @PathVariable Long workflowInstanceId) {
        return ApiResponse.success("Workflow history summary retrieved successfully", historyService.getHistorySummary(workflowInstanceId));
    }

    @GetMapping("/entity/{entityType}/{entityId}/versions")
    @PreAuthorize(RoleConstants.CAN_READ_ALL)
    @Operation(summary = "Get all entity versions by entity type and ID",
               description = "Returns version history with snapshots and diffs. Accessible to AUDITOR.")
    public ApiResponse<List<EntityVersionResponse>> getEntityVersions(
            @PathVariable String entityType,
            @PathVariable Long entityId) {
        return ApiResponse.success("Entity versions retrieved successfully",
                historyService.getEntityVersions(entityType, entityId));
    }
}
