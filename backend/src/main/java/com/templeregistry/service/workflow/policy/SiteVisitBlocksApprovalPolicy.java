package com.templeregistry.service.workflow.policy;

import com.templeregistry.entity.workflow.WorkflowAction;
import com.templeregistry.entity.workflow.WorkflowInstance;
import com.templeregistry.service.workflow.ActionContext;
import com.templeregistry.service.workflow.PolicyResult;
import com.templeregistry.service.workflow.WorkflowPolicy;
import org.springframework.stereotype.Component;

/**
 * [P4] SiteVisitBlocksApprovalPolicy
 *
 * Denies the APPROVE action on a DECLARATION workflow instance
 * whose subStatus equals VERIFICATION_FAILED.
 */
@Component
public class SiteVisitBlocksApprovalPolicy implements WorkflowPolicy {

    @Override
    public String entityType() {
        return "DECLARATION";
    }

    @Override
    public WorkflowAction action() {
        return WorkflowAction.APPROVE;
    }

    @Override
    public PolicyResult evaluate(WorkflowInstance instance, ActionContext context) {
        String subStatus = instance.getSubStatus();
        
        if ("VERIFICATION_FAILED".equals(subStatus)) {
            return PolicyResult.builder()
                .allowed(false)
                .denyReason("Cannot approve declaration: Physical verification has FAILED for this submission.")
                .build();
        }

        return PolicyResult.builder()
            .allowed(true)
            .build();
    }
}
