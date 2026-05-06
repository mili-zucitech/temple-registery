package com.templeregistry.service.governance;

import com.templeregistry.dto.response.governance.EntityVersionResponse;
import com.templeregistry.dto.response.governance.WorkflowHistoryResponse;

import java.util.List;

/**
 * Workflow History Service — provides audit trail of workflow transitions.
 */
public interface WorkflowHistoryService {

    /**
     * Get full chronological history of workflow transitions.
     * Ordered by performedAt ASC (oldest first).
     */
    List<WorkflowHistoryResponse> getHistory(Long workflowInstanceId);

    /**
     * Get condensed summary for WorkflowEnvelope.auditSummary.
     */
    WorkflowHistoryResponse.Summary getHistorySummary(Long workflowInstanceId);

    /**
     * Get all versions of an entity by type and ID.
     * Accessible to CAN_READ_ALL (including AUDITOR).
     */
    List<EntityVersionResponse> getEntityVersions(String entityType, Long entityId);
}
