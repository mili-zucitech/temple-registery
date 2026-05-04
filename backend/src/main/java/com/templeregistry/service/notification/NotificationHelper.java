package com.templeregistry.service.notification;

import com.templeregistry.entity.workflow.WorkflowAction;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.entity.workflow.WorkflowInstance;
import com.templeregistry.entity.workflow.WorkflowStatus;
import com.templeregistry.event.workflow.GovernanceDomainEvent;
import com.templeregistry.repository.workflow.WorkflowInstanceRepository;
import com.templeregistry.service.notification.impl.NotificationRouter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.HashMap;
import java.util.Map;

/**
 * TEMPORARY COMPATIBILITY SHIM - Phase 5A Stabilization
 * 
 * This class provides backward compatibility by delegating to the new event-driven architecture.
 * All methods now properly publish GovernanceDomainEvent via ApplicationEventPublisher.
 * 
 * SAFETY FEATURES:
 * - Transaction-aware routing: checks if transaction active before publishing
 * - WorkflowInstance correlation: resolves workflowInstanceId from (entityType, entityId)
 * - Fallback delivery: routes directly to NotificationRouter if no transaction
 * 
 * MIGRATION PATH:
 * - Phase 5A: Shim delegates to NotificationRouter (current)
 * - Phase 5B: Migrate all callers to direct WorkflowEngine usage
 * - Phase 5C: Delete this shim
 * 
 * DO NOT ADD NEW USAGES OF THIS CLASS.
 * DO NOT EXTEND THIS CLASS.
 * 
 * @deprecated Use WorkflowEngine for state transitions. This shim will be removed in Phase 5B.
 */
@Deprecated(forRemoval = true)
@Component
@Slf4j
public class NotificationHelper {
    
    private final ApplicationEventPublisher eventPublisher;
    private final WorkflowInstanceRepository workflowInstanceRepository;
    private final NotificationRouter notificationRouter;
    private final NotificationRecipientResolver recipientResolver;

    public NotificationHelper(
            ApplicationEventPublisher eventPublisher,
            WorkflowInstanceRepository workflowInstanceRepository,
            @Lazy NotificationRouter notificationRouter,
            NotificationRecipientResolver recipientResolver) {
        this.eventPublisher = eventPublisher;
        this.workflowInstanceRepository = workflowInstanceRepository;
        this.notificationRouter = notificationRouter;
        this.recipientResolver = recipientResolver;
    }
    
    // Temple notifications
    public void notifyTempleCreated(Long templeId, Long createdBy) {
        log.warn("[DEPRECATED] NotificationHelper.notifyTempleCreated() called - migrate to WorkflowEngine");
        publishEvent(WorkflowEntityType.TEMPLE_PROFILE, templeId, WorkflowAction.SUBMIT, 
            WorkflowStatus.DRAFT, WorkflowStatus.SUBMITTED, createdBy, "TA", templeId, null, Map.of());
    }
    
    public void notifyTempleUpdated(Long templeId, Long updatedBy) {
        log.warn("[DEPRECATED] NotificationHelper.notifyTempleUpdated() called - migrate to WorkflowEngine");
        publishEvent(WorkflowEntityType.TEMPLE_PROFILE, templeId, WorkflowAction.EDIT_APPROVED,
            WorkflowStatus.APPROVED, WorkflowStatus.UPDATED_AFTER_APPROVAL, updatedBy, "TA", templeId, null, Map.of());
    }
    
    public void notifyTempleApproved(Long templeId, Long dcUserId) {
        log.warn("[DEPRECATED] NotificationHelper.notifyTempleApproved() called - migrate to WorkflowEngine");
        publishEvent(WorkflowEntityType.TEMPLE_PROFILE, templeId, WorkflowAction.APPROVE,
            WorkflowStatus.UNDER_REVIEW, WorkflowStatus.APPROVED, dcUserId, "DC", templeId, null, Map.of());
    }
    
    public void notifyTempleFlagged(Long templeId, Long dcUserId, String reason) {
        log.warn("[DEPRECATED] NotificationHelper.notifyTempleFlagged() called - migrate to WorkflowEngine");
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("reason", reason != null ? reason : "");
        publishEvent(WorkflowEntityType.TEMPLE_PROFILE, templeId, WorkflowAction.REQUEST_CLARIFICATION,
            WorkflowStatus.UNDER_REVIEW, WorkflowStatus.CLARIFICATION_REQUESTED, dcUserId, "DC", templeId, null, metadata);
    }
    
    public void notifyTempleUnflagged(Long templeId, Long dcUserId) {
        log.warn("[DEPRECATED] NotificationHelper.notifyTempleUnflagged() called - migrate to WorkflowEngine");
        publishEvent(WorkflowEntityType.TEMPLE_PROFILE, templeId, WorkflowAction.RESPOND_CLARIFICATION,
            WorkflowStatus.CLARIFICATION_REQUESTED, WorkflowStatus.CLARIFICATION_RESPONDED, dcUserId, "DC", templeId, null, Map.of());
    }
    
    public void notifyTempleRejected(Long templeId, Long dcUserId, String reason) {
        log.warn("[DEPRECATED] NotificationHelper.notifyTempleRejected() called - migrate to WorkflowEngine");
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("reason", reason != null ? reason : "");
        publishEvent(WorkflowEntityType.TEMPLE_PROFILE, templeId, WorkflowAction.REJECT,
            WorkflowStatus.UNDER_REVIEW, WorkflowStatus.REJECTED, dcUserId, "DC", templeId, null, metadata);
    }
    
    // Trust notifications
    public void notifyTrustSubmitted(Long trustId, Long templeId, String trustName, Long submittedBy) {
        log.warn("[DEPRECATED] NotificationHelper.notifyTrustSubmitted() called - migrate to WorkflowEngine");
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("trustName", trustName != null ? trustName : "");
        publishEvent(WorkflowEntityType.TRUST, trustId, WorkflowAction.SUBMIT,
            WorkflowStatus.DRAFT, WorkflowStatus.SUBMITTED, submittedBy, "TA", templeId, null, metadata);
    }
    
    public void notifyTrustApproved(Long trustId, Long templeId, String trustName, Long dcUserId) {
        log.warn("[DEPRECATED] NotificationHelper.notifyTrustApproved() called - migrate to WorkflowEngine");
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("trustName", trustName != null ? trustName : "");
        publishEvent(WorkflowEntityType.TRUST, trustId, WorkflowAction.APPROVE,
            WorkflowStatus.UNDER_REVIEW, WorkflowStatus.APPROVED, dcUserId, "DC", templeId, null, metadata);
    }
    
    public void notifyTrustRejected(Long trustId, Long templeId, String trustName, Long dcUserId, String reason) {
        log.warn("[DEPRECATED] NotificationHelper.notifyTrustRejected() called - migrate to WorkflowEngine");
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("trustName", trustName != null ? trustName : "");
        metadata.put("reason", reason != null ? reason : "");
        publishEvent(WorkflowEntityType.TRUST, trustId, WorkflowAction.REJECT,
            WorkflowStatus.UNDER_REVIEW, WorkflowStatus.REJECTED, dcUserId, "DC", templeId, null, metadata);
    }
    
    public void notifyTrustFlagged(Long trustId, Long templeId, String trustName, Long dcUserId, String reason) {
        log.warn("[DEPRECATED] NotificationHelper.notifyTrustFlagged() called - migrate to WorkflowEngine");
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("trustName", trustName != null ? trustName : "");
        metadata.put("reason", reason != null ? reason : "");
        publishEvent(WorkflowEntityType.TRUST, trustId, WorkflowAction.REQUEST_CLARIFICATION,
            WorkflowStatus.UNDER_REVIEW, WorkflowStatus.CLARIFICATION_REQUESTED, dcUserId, "DC", templeId, null, metadata);
    }

    public void notifyTrustUpdated(Long trustId, Long templeId, String trustName, Long updatedBy) {
        log.warn("[DEPRECATED] NotificationHelper.notifyTrustUpdated() called - migrate to WorkflowEngine");
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("trustName", trustName != null ? trustName : "");
        publishEvent(WorkflowEntityType.TRUST, trustId, WorkflowAction.EDIT_APPROVED,
            WorkflowStatus.APPROVED, WorkflowStatus.UPDATED_AFTER_APPROVAL, updatedBy, "TA", templeId, null, metadata);
    }

    // Board Member notifications
    public void notifyBoardMemberAdded(Long memberId, Long templeId, String trustName, String memberName, Long addedBy) {
        log.warn("[DEPRECATED] NotificationHelper.notifyBoardMemberAdded() called - migrate to WorkflowEngine");
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("trustName", trustName != null ? trustName : "");
        metadata.put("memberName", memberName != null ? memberName : "");
        publishEvent(WorkflowEntityType.BOARD_MEMBER, memberId, WorkflowAction.SUBMIT,
            WorkflowStatus.DRAFT, WorkflowStatus.SUBMITTED, addedBy, "TA", templeId, null, metadata);
    }

    public void notifyBoardMemberUpdated(Long memberId, Long templeId, String trustName, String memberName, Long updatedBy) {
        log.warn("[DEPRECATED] NotificationHelper.notifyBoardMemberUpdated() called - migrate to WorkflowEngine");
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("trustName", trustName != null ? trustName : "");
        metadata.put("memberName", memberName != null ? memberName : "");
        publishEvent(WorkflowEntityType.BOARD_MEMBER, memberId, WorkflowAction.EDIT_APPROVED,
            WorkflowStatus.APPROVED, WorkflowStatus.UPDATED_AFTER_APPROVAL, updatedBy, "TA", templeId, null, metadata);
    }

    public void notifyBoardMemberRemoved(Long memberId, Long templeId, String trustName, String memberName, Long removedBy) {
        log.warn("[DEPRECATED] NotificationHelper.notifyBoardMemberRemoved() called - migrate to WorkflowEngine");
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("trustName", trustName != null ? trustName : "");
        metadata.put("memberName", memberName != null ? memberName : "");
        // Use a generic "REMOVE" action or similar
        publishEvent(WorkflowEntityType.BOARD_MEMBER, memberId, WorkflowAction.REJECT,
            WorkflowStatus.APPROVED, WorkflowStatus.REJECTED, removedBy, "TA", templeId, null, metadata);
    }
    
    // Declaration notifications
    public void notifyDeclarationSubmitted(Long declarationId, Long templeId, String financialYear, Long submittedBy) {
        log.warn("[DEPRECATED] NotificationHelper.notifyDeclarationSubmitted() called - migrate to WorkflowEngine");
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("financialYear", financialYear != null ? financialYear : "");
        publishEvent(WorkflowEntityType.DECLARATION, declarationId, WorkflowAction.SUBMIT,
            WorkflowStatus.DRAFT, WorkflowStatus.SUBMITTED, submittedBy, "TA", templeId, null, metadata);
    }
    
    public void notifyDeclarationApproved(Long declarationId, Long templeId, String financialYear, Long dcUserId) {
        log.warn("[DEPRECATED] NotificationHelper.notifyDeclarationApproved() called - migrate to WorkflowEngine");
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("financialYear", financialYear != null ? financialYear : "");
        publishEvent(WorkflowEntityType.DECLARATION, declarationId, WorkflowAction.APPROVE,
            WorkflowStatus.UNDER_REVIEW, WorkflowStatus.APPROVED, dcUserId, "DC", templeId, null, metadata);
    }
    
    public void notifyDeclarationRejected(Long declarationId, Long templeId, String financialYear, Long dcUserId, String reason) {
        log.warn("[DEPRECATED] NotificationHelper.notifyDeclarationRejected() called - migrate to WorkflowEngine");
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("financialYear", financialYear != null ? financialYear : "");
        metadata.put("reason", reason != null ? reason : "");
        publishEvent(WorkflowEntityType.DECLARATION, declarationId, WorkflowAction.REJECT,
            WorkflowStatus.UNDER_REVIEW, WorkflowStatus.REJECTED, dcUserId, "DC", templeId, null, metadata);
    }
    
    public void notifyDeclarationFlagged(Long declarationId, Long templeId, String financialYear, Long dcUserId, String reason) {
        log.warn("[DEPRECATED] NotificationHelper.notifyDeclarationFlagged() called - migrate to WorkflowEngine");
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("financialYear", financialYear != null ? financialYear : "");
        metadata.put("reason", reason != null ? reason : "");
        publishEvent(WorkflowEntityType.DECLARATION, declarationId, WorkflowAction.REQUEST_CLARIFICATION,
            WorkflowStatus.UNDER_REVIEW, WorkflowStatus.CLARIFICATION_REQUESTED, dcUserId, "DC", templeId, null, metadata);
    }
    
    public void notifyDeclarationMarkedForPhysicalVisit(Long declarationId, Long templeId, String financialYear, Long dcUserId, String notes) {
        log.warn("[DEPRECATED] NotificationHelper.notifyDeclarationMarkedForPhysicalVisit() called - migrate to WorkflowEngine");
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("financialYear", financialYear != null ? financialYear : "");
        metadata.put("notes", notes != null ? notes : "");
        publishEvent(WorkflowEntityType.DECLARATION, declarationId, WorkflowAction.SCHEDULE_SITE_VISIT,
            WorkflowStatus.UNDER_REVIEW, WorkflowStatus.UNDER_REVIEW, dcUserId, "DC", templeId, null, metadata);
    }
    
    // ─── Helper Method ────────────────────────────────────────────────────────
    
    /**
     * Publishes GovernanceDomainEvent with transaction-aware routing and workflowInstanceId correlation.
     * 
     * SAFETY FEATURES:
     * 1. Transaction Safety: Checks if transaction active before publishing
     *    - If TX active: publish event → listener fires AFTER_COMMIT
     *    - If NO TX: route directly to NotificationRouter (fallback)
     * 
     * 2. WorkflowInstance Correlation: Resolves workflowInstanceId from (entityType, entityId)
     *    - Queries workflow_instance table
     *    - If found: populates workflowInstanceId + districtId
     *    - If not found: logs warning, still publishes (best-effort)
     * 
     * 3. Guaranteed Delivery: Event never dropped
     *    - Transactional path: AFTER_COMMIT listener
     *    - Non-transactional path: direct routing
     */
    private void publishEvent(WorkflowEntityType entityType, Long entityId, WorkflowAction action,
                              WorkflowStatus fromStatus, WorkflowStatus toStatus,
                              Long actorId, String actorRole, Long templeId, Long districtId,
                              Map<String, Object> metadata) {
        
        // ── Step 1: Resolve workflowInstanceId ────────────────────────────────
        Long workflowInstanceId = null;
        Long resolvedDistrictId = districtId;
        
        try {
            WorkflowInstance instance = workflowInstanceRepository
                .findByEntityTypeAndEntityId(entityType, entityId)
                .orElse(null);
            
            if (instance != null) {
                workflowInstanceId = instance.getId();
                resolvedDistrictId = instance.getDistrictId(); // Use workflow instance's districtId
                log.debug("[NotificationHelper] Resolved workflowInstanceId={} for {}/{}",
                    workflowInstanceId, entityType, entityId);
            } else {
                log.warn("[NotificationHelper] NO WorkflowInstance found for {}/{} - event will have null workflowInstanceId",
                    entityType, entityId);
            }
        } catch (Exception e) {
            log.error("[NotificationHelper] Failed to resolve workflowInstanceId for {}/{}: {}",
                entityType, entityId, e.getMessage());
            // Continue with null workflowInstanceId - best-effort delivery
        }
        
        // ── Step 2: Build event ────────────────────────────────────────────────
        GovernanceDomainEvent event = GovernanceDomainEvent.workflowTransition(
            entityType, entityId, workflowInstanceId,
            action, fromStatus, toStatus, null, null,
            actorId, actorRole, templeId, resolvedDistrictId,
            null, // no idempotency key in legacy calls
            metadata
        );
        
        // ── Step 3: Transaction-aware routing ──────────────────────────────────
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            // Normal path: publish event, listener fires AFTER_COMMIT
            eventPublisher.publishEvent(event);
            log.debug("[NotificationHelper] Event published (transactional): {}/{}/{} workflowInstanceId={}",
                entityType, action, entityId, workflowInstanceId);
        } else {
            // Fallback path: route directly to NotificationRouter
            log.warn("[NotificationHelper] NO TRANSACTION ACTIVE - routing directly: {}/{}/{} workflowInstanceId={}",
                entityType, action, entityId, workflowInstanceId);
            notificationRouter.route(event);
        }
    }
}
