package com.templeregistry.entity.notification;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.Instant;

/**
 * Outbox table for reliable domain event delivery.
 *
 * The Outbox Pattern guarantees that domain events are published ONLY after
 * the DB transaction commits. Prevents phantom notifications on TX rollback.
 *
 * Flow:
 *   1. WorkflowEngine writes event to this table within the SAME transaction.
 *   2. Transaction commits → both workflow state and outbox row are durable.
 *   3. NotificationOutboxDispatcher (scheduled or CDC) reads PENDING rows.
 *   4. Dispatches to NotificationRouter.
 *   5. Marks row as DISPATCHED.
 *
 * Replaces:
 *   - @TransactionalEventListener (can miss events on pod restart)
 *   - Direct NotificationHelper calls inside service transactions (races on rollback)
 */
@Entity
@Table(
    name = "notification_outbox",
    indexes = {
        @Index(name = "idx_no_status_created", columnList = "dispatch_status, created_at_instant"),
        @Index(name = "idx_no_workflow_instance_id", columnList = "workflow_instance_id"),
        @Index(name = "idx_no_event_type", columnList = "event_type")
    }
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationOutbox extends BaseEntity {

    /** The serialized GovernanceDomainEvent as JSON. */
    @Column(name = "event_payload_json", columnDefinition = "JSON", nullable = false, updatable = false)
    private String eventPayloadJson;

    /** Denormalized for fast querying — which workflow instance triggered this. */
    @Column(name = "workflow_instance_id", updatable = false)
    private Long workflowInstanceId;

    /** Event type for filtering: WORKFLOW_TRANSITION, CLARIFICATION, SYSTEM. */
    @Column(name = "event_type", length = 40, nullable = false, updatable = false)
    private String eventType;

    /** PENDING, DISPATCHED, FAILED. */
    @Column(name = "dispatch_status", length = 20, nullable = false)
    private String dispatchStatus;

    @Column(name = "created_at_instant", nullable = false, updatable = false)
    private Instant createdAtInstant;

    @Column(name = "dispatched_at")
    private Instant dispatchedAt;

    @Builder.Default
    @Column(name = "retry_count", nullable = false)
    private int retryCount = 0;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;
}
