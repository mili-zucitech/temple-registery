package com.templeregistry.util;

import com.templeregistry.entity.workflow.WorkflowAction;
import com.templeregistry.entity.workflow.WorkflowStatus;
import com.templeregistry.exception.WorkflowException;
import com.templeregistry.service.workflow.TransitionRuleRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Component
@Slf4j
@RequiredArgsConstructor
public class StatusTransitionValidator {
    
    private final TransitionRuleRegistry ruleRegistry;
    
    /**
     * Validates transition by checking TransitionRuleRegistry.
     * Throws WorkflowException if transition is not allowed.
     */
    public void validate(Object currentStatus, Object targetStatus, String entityType) {
        log.warn("[DEPRECATED] StatusTransitionValidator.validate() called - use WorkflowEngine instead");
        
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
     * Validates transition by checking TransitionRuleRegistry.
     * Throws WorkflowException if transition is not allowed.
     */
    public void validateTransition(Object from, Object to) {
        log.warn("[DEPRECATED] StatusTransitionValidator.validateTransition() called - use WorkflowEngine instead");
        validate(from, to, "*"); // Use universal rules
    }
    
    /**
     * Checks if transition is allowed by consulting TransitionRuleRegistry.
     * Returns true if allowed, false otherwise (does not throw).
     */
    public boolean canTransition(Object from, Object to) {
        log.warn("[DEPRECATED] StatusTransitionValidator.canTransition() called - use WorkflowEngine instead");
        
        if (from == null || to == null) {
            return false;
        }
        
        try {
            WorkflowStatus fromStatus = parseStatus(from);
            WorkflowStatus toStatus = parseStatus(to);
            
            // Check if any universal rule allows this transition
            return ruleRegistry.findAllForStatus("*", fromStatus).stream()
                .anyMatch(rule -> rule.getToStatus() == toStatus);
        } catch (Exception e) {
            log.warn("[StatusTransitionValidator] Error checking transition: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Validates Temple Profile Staging transitions.
     * Throws WorkflowException if transition is not allowed.
     */
    public void validateProfileStagingTransition(String from, String to) {
        log.warn("[DEPRECATED] StatusTransitionValidator.validateProfileStagingTransition() called - use WorkflowEngine instead");
        validate(from, to, "TEMPLE");
    }
    
    /**
     * Validates Declaration transitions.
     * Throws WorkflowException if transition is not allowed.
     */
    public void validateDeclarationTransition(String from, String to) {
        log.warn("[DEPRECATED] StatusTransitionValidator.validateDeclarationTransition() called - use WorkflowEngine instead");
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
