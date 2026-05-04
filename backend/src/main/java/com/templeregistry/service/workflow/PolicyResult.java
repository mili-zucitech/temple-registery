package com.templeregistry.service.workflow;

import com.templeregistry.entity.workflow.WorkflowAction;
import com.templeregistry.entity.workflow.WorkflowInstance;
import lombok.Builder;
import lombok.Getter;

/**
 * Policy evaluation result from a WorkflowPolicy bean.
 */
@Getter
@Builder
public class PolicyResult {
    private final boolean allowed;
    private final String denyReason;

    public static PolicyResult allow() {
        return PolicyResult.builder().allowed(true).build();
    }

    public static PolicyResult deny(String reason) {
        return PolicyResult.builder().allowed(false).denyReason(reason).build();
    }
}
