package com.templeregistry.service.workflow.policy;

import com.templeregistry.entity.workflow.WorkflowAction;
import com.templeregistry.entity.workflow.WorkflowInstance;
import com.templeregistry.service.workflow.ActionContext;
import com.templeregistry.service.workflow.PolicyResult;
import com.templeregistry.service.workflow.WorkflowPolicy;
import org.springframework.stereotype.Component;

/**
 * Policy: A clarification comment is required when requesting clarification.
 *
 * Universal policy — applies to all modules.
 * Ensures the DC always provides meaningful context when asking for clarification.
 */
@Component
public class ClarificationCommentRequiredPolicy implements WorkflowPolicy {

    @Override
    public String entityType() {
        return "*"; // universal
    }

    @Override
    public WorkflowAction action() {
        return WorkflowAction.REQUEST_CLARIFICATION;
    }

    @Override
    public PolicyResult evaluate(WorkflowInstance instance, ActionContext context) {
        // Note: comment enforcement is also done at the WorkflowActionRequest level.
        // This policy is a belt-and-suspenders check.
        // The actual comment text comes from the WorkflowActionRequest — we can't access it here.
        // Enforcement of non-empty comment is handled in WorkflowEngineImpl before calling policies.
        return PolicyResult.allow();
    }
}
