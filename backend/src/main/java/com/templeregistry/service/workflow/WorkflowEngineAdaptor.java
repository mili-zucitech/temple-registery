package com.templeregistry.service.workflow;

import com.templeregistry.entity.workflow.*;
import com.templeregistry.repository.workflow.WorkflowInstanceRepository;
import com.templeregistry.security.RoleConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Optional;

/**
 * WorkflowEngineAdaptor — a thin bridge between existing module services
 * and the new WorkflowEngine.
 *
 * Purpose:
 *   Allows TrustServiceImpl, DeclarationServiceImpl, TempleProfileService
 *   to call the WorkflowEngine WITHOUT a full rewrite of their logic.
 *
 * Migration Strategy:
 *   PHASE A (now): Existing services call the adaptor on create/submit/approve/reject.
 *                  Legacy status fields on Trust/Declaration remain for backward-compat.
 *   PHASE B (next sprint): Remove legacy status fields from entities.
 *                  All reads go through WorkflowInstance.status.
 *
 * Key design decision:
 *   The adaptor is idempotent — if a WorkflowInstance already exists for an entity,
 *   it returns the existing one rather than throwing.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowEngineAdaptor {

    private final WorkflowEngine workflowEngine;
    private final WorkflowInstanceRepository instanceRepo;

    // ─── Initialization ───────────────────────────────────────────────────────

    /**
     * Ensure a WorkflowInstance exists for this entity (idempotent).
     * Call from service.create() AFTER saving the entity.
     */
    @Transactional
    public WorkflowInstance ensureInitiated(
        WorkflowEntityType entityType, Long entityId,
        Long templeId, Long districtId, Long createdBy
    ) {
        return ensureInitiated(entityType, entityId, templeId, districtId, createdBy, "TA");
    }

    @Transactional
    public WorkflowInstance ensureInitiated(
        WorkflowEntityType entityType, Long entityId,
        Long templeId, Long districtId, Long createdBy,
        String actorRole
    ) {
        return instanceRepo.findByEntityTypeAndEntityId(entityType, entityId)
            .orElseGet(() -> workflowEngine.initiate(entityType, entityId, templeId, districtId, createdBy, actorRole));
    }

    /**
     * Get workflow instance for an entity — returns null if not yet migrated.
     */
    @Transactional(readOnly = true)
    public Optional<WorkflowInstance> findState(WorkflowEntityType entityType, Long entityId) {
        return instanceRepo.findByEntityTypeAndEntityId(entityType, entityId);
    }

    /**
     * Get workflow instance ID for an entity (for embedding in API responses).
     */
    @Transactional(readOnly = true)
    public Long getWorkflowInstanceId(WorkflowEntityType entityType, Long entityId) {
        return instanceRepo.findByEntityTypeAndEntityId(entityType, entityId)
            .map(WorkflowInstance::getId)
            .orElse(null);
    }

    // ─── State Transition Adaptor ─────────────────────────────────────────────

    /**
     * Execute a submit action for an entity — called from existing service.submit() methods.
     * Idempotent — if already SUBMITTED, logs and returns without error.
     */
    @Transactional
    public boolean adaptSubmit(WorkflowEntityType entityType, Long entityId,
                              Long templeId, Long districtId, Long actorId) {
        WorkflowInstance instance = ensureInitiated(entityType, entityId, templeId, districtId, actorId);

        if (instance.getStatus() == WorkflowStatus.DRAFT
            || instance.getStatus() == WorkflowStatus.CLARIFICATION_REQUESTED
            || instance.getStatus() == WorkflowStatus.UPDATED_AFTER_APPROVAL) {

            WorkflowAction action;
            String comment = null;
            if (instance.getStatus() == WorkflowStatus.UPDATED_AFTER_APPROVAL) {
                action = WorkflowAction.RESUBMIT;
            } else if (instance.getStatus() == WorkflowStatus.CLARIFICATION_REQUESTED) {
                action = WorkflowAction.RESPOND_CLARIFICATION;
                // Governance submit endpoints do not accept a body. Provide a default
                // clarification response comment so RESPOND_CLARIFICATION remains valid.
                comment = "Responded to clarification via submit action";
            } else {
                action = WorkflowAction.SUBMIT;
            }

            execute(instance.getId(), action, actorId, templeId, null, comment, null);
            return true;
        } else if (instance.getStatus() == WorkflowStatus.REJECTED) {
            // REJECTED → UPDATED_AFTER_APPROVAL → RESUBMITTED (two-step per TransitionRuleRegistry)
            execute(instance.getId(), WorkflowAction.EDIT_APPROVED, actorId, templeId, null, null, null);
            execute(instance.getId(), WorkflowAction.RESUBMIT, actorId, templeId, null, null, null);
            return true;
        } else {
            log.debug("[WorkflowAdaptor] Skip adapt-submit — instance={} already in status={}",
                instance.getId(), instance.getStatus());
            return false;
        }
    }

    /**
     * Execute an approve action — called from existing service.approve() methods.
     */
    @Transactional
    public void adaptApprove(WorkflowEntityType entityType, Long entityId,
                               Long districtId, Long actorId) {
        adaptApprove(entityType, entityId, districtId, actorId, null);
    }

    @Transactional
    public void adaptApprove(WorkflowEntityType entityType, Long entityId,
                               Long districtId, Long actorId, String idempotencyKey) {
        instanceRepo.findByEntityTypeAndEntityId(entityType, entityId).ifPresent(instance -> {
            if (instance.getStatus() == WorkflowStatus.SUBMITTED
                || instance.getStatus() == WorkflowStatus.UNDER_REVIEW
                || instance.getStatus() == WorkflowStatus.CLARIFICATION_RESPONDED
                || instance.getStatus() == WorkflowStatus.RESUBMITTED) {
                execute(instance.getId(), WorkflowAction.APPROVE, actorId, null, districtId, null, idempotencyKey);
            }
        });
    }

    /**
     * Execute a reject action.
     */
    @Transactional
    public void adaptReject(WorkflowEntityType entityType, Long entityId,
                              Long districtId, Long actorId, String reason) {
        adaptReject(entityType, entityId, districtId, actorId, reason, null);
    }

    @Transactional
    public void adaptReject(WorkflowEntityType entityType, Long entityId,
                              Long districtId, Long actorId, String reason, String idempotencyKey) {
        instanceRepo.findByEntityTypeAndEntityId(entityType, entityId).ifPresent(instance ->
            execute(instance.getId(), WorkflowAction.REJECT, actorId, null, districtId, reason, idempotencyKey)
        );
    }

    /**
     * Execute a reject-edit action — used when the entity was previously approved and
     * the DC is rejecting an edit (resubmission), not the entity itself.
     * Transitions RESUBMITTED → RE_APPROVED (restoring to the last approved state).
     * The service layer must restore domain entity data BEFORE calling this method.
     */
    @Transactional
    public void adaptRejectEdit(WorkflowEntityType entityType, Long entityId,
                                 Long districtId, Long actorId, String reason) {
        instanceRepo.findByEntityTypeAndEntityId(entityType, entityId).ifPresent(instance ->
            execute(instance.getId(), WorkflowAction.REJECT_EDIT, actorId, null, districtId, reason, null)
        );
    }

    /**
     * Execute a send-back action (legacy compat alias for clarification request).
     */
    @Transactional
    public void adaptSendBack(WorkflowEntityType entityType, Long entityId,
                                Long districtId, Long actorId, String reason) {
        instanceRepo.findByEntityTypeAndEntityId(entityType, entityId).ifPresent(instance ->
                execute(instance.getId(), WorkflowAction.SEND_BACK, actorId, null, districtId, reason, null)
        );
    }

    /**
     * Verify a temple profile — DC action, transitions SUBMITTED/UNDER_REVIEW → APPROVED.
     * Must be called AFTER updating temple.verificationStatus on the entity.
     */
    @Transactional
    public void adaptVerifyTempleProfile(Long templeId, Long districtId, Long actorId) {
        instanceRepo.findByEntityTypeAndEntityId(WorkflowEntityType.TEMPLE_PROFILE, templeId).ifPresent(instance ->
            execute(instance.getId(), WorkflowAction.VERIFY_TEMPLE_PROFILE, actorId, templeId, districtId, null, null)
        );
    }

    /**
     * Flag a temple profile — DC action, transitions to CLARIFICATION_REQUESTED (subStatus FLAGGED).
     * Must be called AFTER updating temple.verificationStatus on the entity.
     */
    @Transactional
    public void adaptFlagTempleProfile(Long templeId, Long districtId, Long actorId, String reason) {
        instanceRepo.findByEntityTypeAndEntityId(WorkflowEntityType.TEMPLE_PROFILE, templeId).ifPresent(instance ->
            execute(instance.getId(), WorkflowAction.FLAG_TEMPLE_PROFILE, actorId, templeId, districtId, reason, null)
        );
    }

    /**
     * Unflag a temple profile — DC action, transitions CLARIFICATION_REQUESTED → SUBMITTED.
     * Must be called AFTER updating temple.verificationStatus on the entity.
     */
    @Transactional
    public void adaptUnflagTempleProfile(Long templeId, Long districtId, Long actorId) {
        instanceRepo.findByEntityTypeAndEntityId(WorkflowEntityType.TEMPLE_PROFILE, templeId).ifPresent(instance ->
            execute(instance.getId(), WorkflowAction.UNFLAG_TEMPLE_PROFILE, actorId, templeId, districtId, null, null)
        );
    }

    /**
     * Mark entity as UPDATED_AFTER_APPROVAL (TA edits an approved entity).
     */
    @Transactional
    public void adaptEditApproved(WorkflowEntityType entityType, Long entityId, Long actorId, Long templeId) {
        instanceRepo.findByEntityTypeAndEntityId(entityType, entityId).ifPresent(instance -> {
            if (instance.getStatus() == WorkflowStatus.APPROVED
                    || instance.getStatus() == WorkflowStatus.RE_APPROVED
                    || instance.getStatus() == WorkflowStatus.REJECTED) {
                execute(instance.getId(), WorkflowAction.EDIT_APPROVED, actorId, templeId, null, null, null);
            }
        });
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    /**
     * Returns the current WorkflowStatus for an entity, or DRAFT if no instance exists.
     * Use this instead of reading legacy status fields from entity classes.
     */
    @Transactional(readOnly = true)
    public WorkflowStatus currentStatus(WorkflowEntityType entityType, Long entityId) {
        return instanceRepo.findByEntityTypeAndEntityId(entityType, entityId)
            .map(WorkflowInstance::getStatus)
            .orElse(WorkflowStatus.DRAFT);
    }

    private void execute(Long instanceId, WorkflowAction action, Long actorId,
                                Long templeId, Long districtId, String comment, String clientIdempotencyKey) {
        String role = resolveRole(action, districtId);
        ActionContext ctx = ActionContext.builder()
            .actorId(actorId)
            .actorRole(role)
            .actorDistrictId(districtId)
            .ownedTempleIds(templeId != null ? java.util.Set.of(templeId) : null)
            .build();

        workflowEngine.execute(instanceId,
            WorkflowActionRequest.builder()
                .action(action)
                .comment(comment)
                .idempotencyKey(effectiveIdempotencyKey(clientIdempotencyKey))
                .build(),
            ctx
        );
    }

    private String effectiveIdempotencyKey(String clientProvidedKey) {
        return StringUtils.hasText(clientProvidedKey)
            ? clientProvidedKey
            : java.util.UUID.randomUUID().toString();
    }

    private String resolveRole(WorkflowAction action, Long districtId) {
        return switch (action) {
            case APPROVE, REJECT, REJECT_EDIT, SEND_BACK, REQUEST_CLARIFICATION,
                 VERIFY_TEMPLE_PROFILE, FLAG_TEMPLE_PROFILE, UNFLAG_TEMPLE_PROFILE ->
                districtId != null ? "DC" : RoleConstants.SUPER_ADMIN;
            default -> "TA";
        };
    }
}
