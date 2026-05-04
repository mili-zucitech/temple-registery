package com.templeregistry.event.workflow;

import com.templeregistry.entity.workflow.WorkflowAction;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.entity.workflow.WorkflowStatus;

import java.time.Instant;
import java.util.Map;

/**
 * Canonical domain event emitted by the WorkflowEngine after every state transition.
 *
 * This single event type replaces ALL module-specific event classes:
 *   - TempleProfileCreatedEvent, TempleProfileApprovedEvent, etc.
 *   - TrustDataSubmittedEvent, TrustDataApprovedEvent, etc.
 *   - DeclarationSubmittedEvent, DeclarationApprovedEvent, etc.
 *
 * Consumers (NotificationRouter, AuditService, etc.) receive this event and act
 * based on entityType + action + eventType.
 *
 * Published via Spring's ApplicationEventPublisher AFTER TX commit using
 * @TransactionalEventListener(phase = AFTER_COMMIT) to prevent phantom events on rollback.
 *
 * For guaranteed delivery across restarts, the outbox pattern writes to notification_outbox
 * within the same TX, which the dispatcher picks up independently.
 */
public record GovernanceDomainEvent(
    /** WORKFLOW_TRANSITION | CLARIFICATION | TASK | SYSTEM */
    String eventType,

    WorkflowEntityType entityType,

    Long entityId,

    Long workflowInstanceId,

    WorkflowAction action,

    WorkflowStatus fromStatus,

    WorkflowStatus toStatus,

    String fromSubStatus,

    String toSubStatus,

    /** User who triggered this event. */
    Long actorId,

    String actorRole,

    Long templeId,

    Long districtId,

    /** When this event occurred. */
    Instant occurredAt,

    /** Idempotency key from the originating command. */
    String idempotencyKey,

    /**
     * Action-specific metadata (reason, comment, financialYear, etc.).
     * Consumers may extract values using well-known keys.
     */
    Map<String, Object> metadata
) {
    public static GovernanceDomainEvent workflowTransition(
        WorkflowEntityType entityType, Long entityId, Long instanceId,
        WorkflowAction action, WorkflowStatus from, WorkflowStatus to,
        String fromSub, String toSub,
        Long actorId, String actorRole, Long templeId, Long districtId,
        String idempotencyKey, Map<String, Object> metadata
    ) {
        return new GovernanceDomainEvent(
            "WORKFLOW_TRANSITION", entityType, entityId, instanceId,
            action, from, to, fromSub, toSub,
            actorId, actorRole, templeId, districtId,
            Instant.now(), idempotencyKey, metadata
        );
    }

    public static GovernanceDomainEvent clarification(
        WorkflowEntityType entityType, Long entityId, Long instanceId,
        WorkflowAction action, WorkflowStatus currentStatus,
        Long actorId, String actorRole, Long templeId, Long districtId,
        Map<String, Object> metadata
    ) {
        return new GovernanceDomainEvent(
            "CLARIFICATION", entityType, entityId, instanceId,
            action, currentStatus, currentStatus, null, null,
            actorId, actorRole, templeId, districtId,
            Instant.now(), null, metadata
        );
    }

    public static GovernanceDomainEvent system(
        WorkflowEntityType entityType, Long entityId, Long instanceId,
        WorkflowAction action, WorkflowStatus currentStatus,
        Long templeId, Long districtId, Map<String, Object> metadata
    ) {
        return new GovernanceDomainEvent(
            "SYSTEM", entityType, entityId, instanceId,
            action, currentStatus, currentStatus, null, null,
            0L, "SYSTEM", templeId, districtId,
            Instant.now(), null, metadata
        );
    }
}
