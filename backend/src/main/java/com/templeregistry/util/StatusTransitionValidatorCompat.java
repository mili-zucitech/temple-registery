package com.templeregistry.util;

import com.templeregistry.entity.workflow.WorkflowStatus;
import com.templeregistry.exception.WorkflowException;
import com.templeregistry.service.workflow.TransitionRuleRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * TEMPORARY COMPATIBILITY SHIM - Phase 5A Stabilization
 * 
 * This class provides backward compatibility by delegating to TransitionRuleRegistry.
 * All validation now properly checks against registered transition rules.
 * 
 * MIGRATION PATH:
 * - Phase 5A: Shim delegates to TransitionRuleRegistry (current)
 * - Phase 5B: Remove all references to this class
 * - Phase 5C: Delete this shim
 * 
 * DO NOT ADD NEW USAGES OF THIS CLASS.
 * DO NOT EXTEND THIS CLASS.
 * 
 * @deprecated Validation is now handled by WorkflowEngine. This shim will be removed in Phase 5B.
 */
@Deprecated(forRemoval = true)
@ConditionalOnProperty(name = "app.legacy.enabled", havingValue = "true", matchIfMissing = false)
@Component
@Slf4j
@RequiredArgsConstructor
public class StatusTransitionValidatorCompat {
    
    private final TransitionRuleRegistry ruleRegistry;
    
    /**
     * Validates transition by checking TransitionRuleRegistry.
     * Throws WorkflowException if transition is not allowed.
     */
    public void validate(Object currentStatus, Object targetStatus, String entityType) {
        log.warn("[DEPRECATED] StatusTransitionValidatorCompat.validate() called - use WorkflowEngine instead");
        
        if (currentStatus == null || targetStatus == null) {
            throw new WorkflowException("Status cannot be null");
        }
        
        WorkflowStatus from = parseStatus(currentStatus);
        WorkflowStatus to = parseStatus(targetStatus);
        
        // Check if any rule allows this transition for the given entity type
        boolean allowed = ruleRegistry.findAllForStatus(entityType, from).stream()
            .anyMatch(rule -> rule.getToStatus() == to);
        
        if (!allowed) {
            throw new WorkflowException(
                String.format("Invalid transition: %s -> %s for entity type %s", from, to, entityType)
            );
        }
    }
    
    /**
     * Validates Declaration transitions.
     * Throws WorkflowException if transition is not allowed.
     */
    public void validateDeclarationTransition(String from, String to) {
        log.warn("[DEPRECATED] StatusTransitionValidatorCompat.validateDeclarationTransition() called - use WorkflowEngine instead");
        validate(from, to, "DECLARATION");
    }
    
    // ─── Helper Methods ───────────────────────────────────────────────────────
    
    private WorkflowStatus parseStatus(Object status) {
        if (status instanceof WorkflowStatus) {
            return (WorkflowStatus) status;
        }
        if (status instanceof String) {
            try {
                return WorkflowStatus.valueOf((String) status);
            } catch (IllegalArgumentException e) {
                throw new WorkflowException("Invalid status: " + status);
            }
        }
        throw new WorkflowException("Unsupported status type: " + status.getClass().getName());
    }
}
