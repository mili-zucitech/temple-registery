package com.templeregistry.service.workflow;

import com.templeregistry.entity.workflow.WorkflowAction;
import com.templeregistry.entity.workflow.WorkflowInstance;
import com.templeregistry.entity.workflow.WorkflowStatus;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * Result of a successful WorkflowEngine.execute() call.
 * Returned to the controller and serialized into the API WorkflowEnvelope.
 */
@Getter
@Builder
public class WorkflowTransitionResult {

    private final Long workflowInstanceId;
    private final WorkflowStatus newStatus;
    private final String newSubStatus;
    private final Long newVersion;
    private final List<AvailableAction> availableActions;

    /** Whether this was a cache hit (idempotency replay). */
    private final boolean cached;

    public static WorkflowTransitionResult from(WorkflowInstance wi, List<AvailableAction> actions) {
        return WorkflowTransitionResult.builder()
            .workflowInstanceId(wi.getId())
            .newStatus(wi.getStatus())
            .newSubStatus(wi.getSubStatus())
            .newVersion(wi.getLockVersion())
            .availableActions(actions)
            .cached(false)
            .build();
    }
}
