package com.templeregistry.service.workflow;

import com.templeregistry.entity.workflow.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * The canonical governance workflow engine — single entry point for ALL state transitions.
 *
 * Contract:
 *   - Every state change for Temple Profile, Declaration, Trust, Board Member MUST go through here.
 *   - Direct entity.setStatus() calls outside this engine are FORBIDDEN after migration.
 *   - Engine validates, transitions, audits, versions, and publishes events atomically.
 *
 * Extension hooks for future modules:
 *   - Register a new WorkflowPolicy @Component targeting the new entityType.
 *   - No changes to this interface required.
 */
public interface WorkflowEngine {

    /**
     * Initialize a new workflow instance when a governable entity is created.
     * Status starts at DRAFT. Creates the first entity_version snapshot.
     *
     * @param entityType  The module type
     * @param entityId    The PK of the domain entity
     * @param templeId    Ownership scoping
     * @param districtId  Jurisdiction scoping
     * @param createdBy   User creating the entity
     * @return The newly created WorkflowInstance
     */
    WorkflowInstance initiate(
        WorkflowEntityType entityType,
        Long entityId,
        Long templeId,
        Long districtId,
        Long createdBy
    );

    /**
     * Execute a workflow action (submit, approve, reject, clarify, etc.).
     *
     * Validation order:
     *   1. Idempotency check — return cached result if key already seen
     *   2. Transition rule lookup — is action valid from current status?
     *   3. Role check — does actor have required role for this action?
     *   4. Jurisdiction check — is DC in the right district?
     *   5. Policy evaluation — module-specific business rules
     *   6. Optimistic lock version check
     *   7. Execute transition + record audit + publish outbox event
     *
     * @param workflowInstanceId  The workflow instance to act on
     * @param request             Command with action, expectedVersion, idempotencyKey, comment
     * @param context             Actor context (userId, role, districtId)
     * @return Transition result with new status and available actions
     */
    WorkflowTransitionResult execute(
        Long workflowInstanceId,
        WorkflowActionRequest request,
        ActionContext context
    );

    /**
     * Convenience overload for internal system actions (schedulers, auto-transitions).
     */
    WorkflowTransitionResult executeSystem(
        Long workflowInstanceId,
        WorkflowAction action,
        String comment
    );

    /**
     * Get current workflow state for an entity.
     *
     * @throws jakarta.persistence.EntityNotFoundException if no instance found
     */
    WorkflowInstance getState(WorkflowEntityType entityType, Long entityId);

    /**
     * Get current workflow state by workflow instance ID.
     */
    WorkflowInstance getStateById(Long workflowInstanceId);

    /**
     * Compute the list of actions available to a user on a given workflow instance.
     * Used to populate availableActions in API responses.
     */
    List<AvailableAction> getAvailableActions(Long workflowInstanceId, ActionContext context);

    /**
     * Dashboard query — find all workflow instances for a DC with optional filters.
     */
    Page<WorkflowInstance> findForDashboard(WorkflowQueryFilter filter, Pageable pageable);

    /**
     * Count pending items for a DC's district (for badge counts).
     */
    long countPendingForDistrict(Long districtId);

    /**
     * Count pending items for a Temple (for TA badge counts).
     */
    long countPendingForTemple(Long templeId);
}
