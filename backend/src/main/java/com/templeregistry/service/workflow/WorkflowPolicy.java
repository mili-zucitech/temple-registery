package com.templeregistry.service.workflow;

import com.templeregistry.entity.workflow.WorkflowAction;
import com.templeregistry.entity.workflow.WorkflowInstance;

/**
 * Extension point for module-specific business rule enforcement.
 *
 * WorkflowPolicy beans are discovered automatically by the WorkflowEngine
 * via Spring's dependency injection. No manual registration required.
 *
 * To add a new policy:
 *   1. Create a @Component implementing this interface.
 *   2. Return the entityType and action it applies to.
 *   3. Implement the evaluate() method.
 *
 * The engine calls ALL policies matching (entityType + action) before executing.
 * If any policy denies, the transition is rejected with the deny reason.
 *
 * Example: Declaration cannot be approved if a site visit failed.
 */
public interface WorkflowPolicy {

    /**
     * Entity type this policy applies to.
     * Return "*" for policies that apply to all modules.
     */
    String entityType();

    /**
     * Action that triggers this policy evaluation.
     */
    WorkflowAction action();

    /**
     * Evaluate whether the transition should be allowed.
     */
    PolicyResult evaluate(WorkflowInstance instance, ActionContext context);
}
