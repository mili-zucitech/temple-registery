package com.templeregistry.entity.workflow;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.Instant;

/**
 * The single source of truth for workflow state across ALL governable entities.
 *
 * Design rationale:
 *   - Registry entities (Trust, Declaration, TempleProfileStaging) own their domain data only.
 *   - Workflow state (status, version, actor, timestamps) lives exclusively here.
 *   - Linked to domain entities via (entityType, entityId) — no FK constraint to avoid
 *     cross-aggregate coupling.
 *
 * Optimistic locking:
 *   - JPA @Version on `lockVersion` provides optimistic locking.
 *   - Every workflow action requires caller to supply `expectedVersion`.
 *   - Stale version → OptimisticLockException → 409 Conflict to client.
 *
 * Replaces:
 *   - Trust.submissionStatus + Trust.dcDecisionStatus
 *   - AssetDeclaration.status
 *   - TempleProfileStaging.status
 *   - BoardMember.isVerifiedByDc
 */
@Entity
@Table(
    name = "workflow_instances",
    indexes = {
        @Index(name = "idx_wi_entity", columnList = "entity_type, entity_id", unique = true),
        @Index(name = "idx_wi_status", columnList = "status"),
        @Index(name = "idx_wi_district_status", columnList = "district_id, status"),
        @Index(name = "idx_wi_temple_status", columnList = "temple_id, status"),
        @Index(name = "idx_wi_created_by", columnList = "created_by_user_id")
    }
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowInstance extends BaseEntity {

    // ─── Entity Reference ─────────────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 30, updatable = false)
    private WorkflowEntityType entityType;

    @Column(name = "entity_id", nullable = false, updatable = false)
    private Long entityId;

    // ─── Workflow State ───────────────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private WorkflowStatus status;

    /**
     * Optional sub-state within the parent status.
     * Used for module-specific nuances (e.g., SITE_VISIT_SCHEDULED within UNDER_REVIEW).
     * Never creates a new top-level transition — the base state machine is unchanged.
     */
    @Column(name = "sub_status", length = 50)
    private String subStatus;

    /**
     * Optimistic lock version.
     * JPA auto-increments on every UPDATE. Client must supply expectedVersion to detect conflicts.
     */
    @Version
    @Builder.Default
    @Column(name = "lock_version", nullable = false)
    private Long lockVersion = 0L;

    /**
     * Business version number.
     * Increments when a new draft overlay is created after approval (edit-after-approval flow).
     * Not the same as lockVersion — lockVersion is for concurrency, versionNumber is for business history.
     */
    @Builder.Default
    @Column(name = "version_number", nullable = false)
    private int versionNumber = 1;

    // ─── Actor / Ownership ────────────────────────────────────────────────────

    /**
     * Role of the actor currently expected to act.
     * TA when waiting for TA action, DC when waiting for DC action, SYSTEM for automated steps.
     */
    @Column(name = "current_actor_role", length = 20)
    private String currentActorRole;

    /** The user who originally submitted/created this entity. */
    @Column(name = "created_by_user_id", nullable = false, updatable = false)
    private Long createdByUserId;

    /** Temple this workflow instance belongs to. Used for ownership checks + notifications. */
    @Column(name = "temple_id", nullable = false, updatable = false)
    private Long templeId;

    /** District this workflow instance is scoped to. Used for jurisdiction checks. */
    @Column(name = "district_id", nullable = false, updatable = false)
    private Long districtId;

    // ─── SLA / Deadline ───────────────────────────────────────────────────────

    /** Optional SLA deadline. If now > deadlineAt and not yet decided, FLAG_OVERDUE fires. */
    @Column(name = "deadline_at")
    private Instant deadlineAt;

    /** Timestamp when status transitioned to SUBMITTED. Used for SLA calculation. */
    @Column(name = "submitted_at")
    private Instant submittedAt;

    /** Timestamp when the current status was set. */
    @Column(name = "status_updated_at")
    private Instant statusUpdatedAt;

    // ─── Module Metadata ──────────────────────────────────────────────────────

    /**
     * Optional JSON blob for module-specific metadata not covered by standard fields.
     * Examples: { "financialYear": "2025-26" } for declarations.
     * Never use this for status data — status lives in `status` + `subStatus`.
     */
    @Column(name = "metadata_json", columnDefinition = "JSON")
    private String metadataJson;

    // ─── Convenience ─────────────────────────────────────────────────────────

    public boolean isInStatus(WorkflowStatus... statuses) {
        for (WorkflowStatus s : statuses) {
            if (s == this.status) return true;
        }
        return false;
    }

    public boolean isApproved() {
        return status == WorkflowStatus.APPROVED || status == WorkflowStatus.RE_APPROVED;
    }

    public boolean isPendingDcAction() {
        return status == WorkflowStatus.SUBMITTED
            || status == WorkflowStatus.UNDER_REVIEW
            || status == WorkflowStatus.CLARIFICATION_RESPONDED
            || status == WorkflowStatus.RESUBMITTED;
    }

    public boolean isPendingTaAction() {
        return status == WorkflowStatus.CLARIFICATION_REQUESTED
            || status == WorkflowStatus.UPDATED_AFTER_APPROVAL
            || status == WorkflowStatus.REJECTED;
    }
}
