package com.templeregistry.service.governance;

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
}
