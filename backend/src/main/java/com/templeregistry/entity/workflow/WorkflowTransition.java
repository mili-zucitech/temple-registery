package com.templeregistry.entity.workflow;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.Instant;

/**
 * Immutable audit record of every workflow state transition.
 *
 * One row per transition. Never updated — only inserted.
 * Provides full audit trail: who did what, when, from which state, to which state.
 */
@Entity
@Table(
    name = "workflow_transitions",
    indexes = {
        @Index(name = "idx_wt_instance_id", columnList = "workflow_instance_id"),
        @Index(name = "idx_wt_actor_id", columnList = "actor_id"),
        @Index(name = "idx_wt_performed_at", columnList = "performed_at")
    }
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowTransition extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_instance_id", nullable = false, updatable = false)
    private WorkflowInstance workflowInstance;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 40, updatable = false)
    private WorkflowStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 40, updatable = false)
    private WorkflowStatus toStatus;

    @Column(name = "from_sub_status", length = 50, updatable = false)
    private String fromSubStatus;

    @Column(name = "to_sub_status", length = 50, updatable = false)
    private String toSubStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 40, updatable = false)
    private WorkflowAction action;

    /** User who triggered this transition. */
    @Column(name = "actor_id", nullable = false, updatable = false)
    private Long actorId;

    /** Role of the actor at time of action (TA, DC, SYSTEM, SUPER_ADMIN). */
    @Column(name = "actor_role", length = 20, updatable = false)
    private String actorRole;

    /** Optional comment or reason provided by the actor. */
    @Column(name = "comment", columnDefinition = "TEXT", updatable = false)
    private String comment;

    /** Instance version at time of this transition (before increment). */
    @Column(name = "instance_version_at_transition", updatable = false)
    private Long instanceVersionAtTransition;

    @Column(name = "performed_at", nullable = false, updatable = false)
    private Instant performedAt;

    /**
     * Idempotency key used for this transition.
     * Stored here for full audit traceability.
     */
    @Column(name = "idempotency_key", length = 64, updatable = false)
    private String idempotencyKey;
}
