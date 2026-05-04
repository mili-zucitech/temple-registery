package com.templeregistry.entity.versioning;

import com.templeregistry.entity.base.BaseEntity;
import com.templeregistry.entity.workflow.WorkflowInstance;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.Instant;

/**
 * Immutable version snapshot of a governable entity at a point in time.
 *
 * Replaces:
 *   - AssetDeclarationVersion (cloning entire rows — expensive)
 *   - TempleProfileStaging SUPERSEDED pattern (no diff support)
 *   - Trust (no versioning at all — adds it)
 *   - BoardMember (snapshotted as part of Trust snapshot)
 *
 * Design:
 *   - Snapshot is a JSON blob of the full entity state at time of action.
 *   - Diff is computed between consecutive approved versions and stored as JSON.
 *   - Approved versions are NEVER modified in-place — only status changes.
 *   - Edit-after-approval creates a DRAFT_OVERLAY version.
 */
@Entity
@Table(
    name = "entity_versions",
    indexes = {
        @Index(name = "idx_ev_workflow_instance_id", columnList = "workflow_instance_id"),
        @Index(name = "idx_ev_version_number", columnList = "workflow_instance_id, version_number"),
        @Index(name = "idx_ev_status", columnList = "status")
    }
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class EntityVersion extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_instance_id", nullable = false, updatable = false)
    private WorkflowInstance workflowInstance;

    /**
     * Monotonically increasing version counter per workflow instance.
     * V1 = initial submission, V2 = first edit after approval, etc.
     */
    @Column(name = "version_number", nullable = false, updatable = false)
    private int versionNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private EntityVersionStatus status;

    /**
     * Full entity state at this version, serialized as JSON.
     * Includes all domain fields (trust name, board members, asset values, etc.)
     * Never includes workflow state — workflow state lives in workflow_instance.
     */
    @Column(name = "snapshot_json", columnDefinition = "JSON", nullable = false, updatable = false)
    private String snapshotJson;

    /**
     * Structured field-level diff between this version and the previous approved version.
     * Format: [{ "fieldPath": "trustName", "oldValue": "A", "newValue": "B", "type": "MODIFIED" }, ...]
     * Null for V1 (no previous version to compare against).
     */
    @Column(name = "diff_json", columnDefinition = "JSON")
    private String diffJson;

    /** User who created this version (TA who submitted / edited). */
    @Column(name = "created_by_user_id", nullable = false, updatable = false)
    private Long createdByUserId;

    /** DC who approved this version. Null for non-approved versions. */
    @Column(name = "approved_by_user_id")
    private Long approvedByUserId;

    @Column(name = "approved_at")
    private Instant approvedAt;

    // ─── Denormalized fields (Phase B — added for VersionService) ─────────────
    // These mirror WorkflowInstance.entityType/entityId to enable direct querying
    // without a JOIN through the workflowInstance relationship.

    /**
     * Denormalized entity type — mirrors workflowInstance.entityType.
     * Populated by VersionService.snapshot(); allows querying all versions
     * for a given entity without loading the WorkflowInstance.
     */
    @Column(name = "entity_type", length = 30)
    private String entityType;

    /**
     * Denormalized entity PK — mirrors workflowInstance.entityId.
     */
    @Column(name = "entity_id")
    private Long entityId;

    /** When the snapshot was captured (may differ from BaseEntity.createdAt if async). */
    @Column(name = "captured_at")
    private Instant capturedAt;

    /** User who triggered the snapshot (TA for SUBMIT, DC for APPROVE). */
    @Column(name = "captured_by_user_id")
    private Long capturedByUserId;

    /** WorkflowTransition.id that triggered this snapshot — for full auditability. */
    @Column(name = "triggering_transition_id")
    private Long triggeringTransitionId;
}

