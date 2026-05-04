package com.templeregistry.service.audit;

import com.templeregistry.entity.audit.GovernanceActionHistory;
import com.templeregistry.entity.workflow.WorkflowInstance;
import com.templeregistry.entity.workflow.WorkflowTransition;
import java.util.List;

public interface GovernanceAuditService {
    void logAction(Long entityId, String entityType, Long dcUserId, String action, String comment);
    void logWorkflowTransition(WorkflowInstance instance, WorkflowTransition transition);
    List<GovernanceActionHistory> getHistoryForEntity(String entityType, Long entityId);
}
