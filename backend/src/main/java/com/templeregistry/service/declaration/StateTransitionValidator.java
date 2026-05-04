package com.templeregistry.service.declaration;

import com.templeregistry.entity.declaration.DeclarationStatus;
import org.springframework.stereotype.Component;

/**
 * @deprecated Replaced by TransitionRuleRegistry in the WorkflowEngine.
 * This stub exists only for backward compatibility with legacy services.
 * All validation is now performed by WorkflowEngine.execute() via TransitionRuleRegistry.
 *
 * DO NOT add new callers. Remove this class in Phase 6 cleanup.
 */
@Deprecated(since = "Phase5", forRemoval = true)
@Component
public class StateTransitionValidator {

    /** No-op — validation is now handled by WorkflowEngine + TransitionRuleRegistry. */
    public void validate(DeclarationStatus from, DeclarationStatus to) {
        // No-op: WorkflowEngine validates transitions via TransitionRuleRegistry
    }
}
