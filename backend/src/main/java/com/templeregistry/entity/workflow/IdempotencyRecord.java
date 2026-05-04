package com.templeregistry.entity.workflow;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.Instant;

/**
 * Idempotency record for workflow commands.
 *
 * Every workflow action (submit, approve, reject, etc.) is tagged with a client-supplied
 * idempotencyKey (UUID). If the same key is received twice, the second request returns
 * the cached result without re-executing the transition.
 *
 * TTL: Records are soft-expired after 24 hours (cleanup by scheduler).
 *
 * Prevents:
 *   - Double-submit on slow networks
 *   - Retry storms after transient failures
 *   - Both duplicate notification pipelines firing for same action
 */
@Entity(name = "WorkflowIdempotencyRecord")
@Table(
    name = "workflow_idempotency_records",
    indexes = {
        @Index(name = "idx_wir_key", columnList = "idempotency_key", unique = true),
        @Index(name = "idx_wir_expires_at", columnList = "expires_at")
    }
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class IdempotencyRecord extends BaseEntity {

    @Column(name = "actor_user_id", nullable = false, updatable = false)
    private Long actorUserId;

    @Column(name = "idempotency_key", length = 64, nullable = false, unique = true, updatable = false)
    private String idempotencyKey;

    @Column(name = "workflow_instance_id", nullable = false, updatable = false)
    private Long workflowInstanceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 40, updatable = false)
    private WorkflowAction action;

    /** SUCCESS or FAILED. */
    @Column(name = "result_status", length = 20, updatable = false)
    private String resultStatus;

    /** Serialized WorkflowTransitionResult for cache replay. */
    @Column(name = "result_json", columnDefinition = "JSON", updatable = false)
    private String resultJson;

    @Column(name = "created_at_instant", nullable = false, updatable = false)
    private Instant createdAtInstant;

    /** After this time the record can be cleaned up by the scheduler. Default: +24h. */
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
}
