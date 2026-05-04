package com.templeregistry.entity.clarification;

import com.templeregistry.entity.base.BaseEntity;
import com.templeregistry.entity.workflow.WorkflowInstance;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * A single round of DC↔TA clarification dialogue linked to a workflow instance.
 *
 * Unified model replacing:
 *   - DeclarationClarification (declaration-specific full model)
 *   - Trust.sendBackReason (string field — too primitive)
 *   - Temple Profile clarification (was missing entirely)
 *
 * Design:
 *   - One thread per clarification round (not per message).
 *   - Thread tracks round number, status, SLA deadline.
 *   - Messages within the thread are bidirectional (DC_TO_TA, TA_TO_DC).
 *   - DC can follow up within the same thread (same round).
 *   - TA responds. DC resolves.
 */
@Entity
@Table(
    name = "clarification_threads",
    indexes = {
        @Index(name = "idx_ct_workflow_instance_id", columnList = "workflow_instance_id"),
        @Index(name = "idx_ct_status", columnList = "status"),
        @Index(name = "idx_ct_requested_by", columnList = "requested_by")
    }
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class ClarificationThread extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_instance_id", nullable = false, updatable = false)
    private WorkflowInstance workflowInstance;

    /**
     * Which round this is. Starts at 1. Increments each time DC opens a new clarification
     * on the same workflow instance.
     */
    @Column(name = "round_number", nullable = false, updatable = false)
    private int roundNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ClarificationStatus status;

    /** User who opened this clarification (DC). */
    @Column(name = "requested_by", nullable = false, updatable = false)
    private Long requestedBy;

    @Column(name = "requested_at", nullable = false, updatable = false)
    private Instant requestedAt;

    /** Set when TA first responds. */
    @Column(name = "responded_by")
    private Long respondedBy;

    @Column(name = "responded_at")
    private Instant respondedAt;

    /** Set when DC resolves the thread. */
    @Column(name = "resolved_by")
    private Long resolvedBy;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    /** Optional SLA deadline for TA to respond. Null = no deadline enforced. */
    @Column(name = "sla_deadline")
    private Instant slaDeadline;

    /**
     * Escalation level. 0 = normal. 1 = escalated to SUPER_ADMIN.
     * Incremented by policy engine when round number exceeds module threshold.
     */
    @Builder.Default
    @Column(name = "escalation_level", nullable = false)
    private int escalationLevel = 0;

    @OneToMany(mappedBy = "thread", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    @OrderBy("createdAt ASC")
    private List<ClarificationMessage> messages = new ArrayList<>();
}
