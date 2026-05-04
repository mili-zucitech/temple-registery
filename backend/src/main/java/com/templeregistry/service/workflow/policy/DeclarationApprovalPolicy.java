package com.templeregistry.service.workflow.policy;

import com.templeregistry.entity.workflow.WorkflowAction;
import com.templeregistry.entity.workflow.WorkflowInstance;
import com.templeregistry.service.workflow.ActionContext;
import com.templeregistry.service.workflow.PolicyResult;
import com.templeregistry.service.workflow.WorkflowPolicy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * @deprecated Exact duplicate of SiteVisitBlocksApprovalPolicy which is already registered
 * as a Spring bean. Having both registered causes the engine to apply the same deny-rule
 * twice, producing confusing duplicate error messages. Excluded from the Spring context.
 * Remove in a future cleanup sprint.
 */
@Deprecated(forRemoval = true)
@RequiredArgsConstructor
@Slf4j
public class DeclarationApprovalPolicy implements WorkflowPolicy {

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
        if ("VERIFICATION_FAILED".equals(instance.getSubStatus())) {
            return PolicyResult.deny(
                "Cannot approve: site visit verification has failed. " +
                "Schedule a new site visit or reject the declaration."
            );
        }
        return PolicyResult.allow();
    }
}
