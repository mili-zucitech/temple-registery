package com.templeregistry.entity.observation;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

/**
 * An observation raised by an AUDITOR about a temple or related entity.
 *
 * Lifecycle: OPEN → ASSIGNED → UNDER_REVIEW → CLOSED
 *
 * AUDITOR creates. SUPER_ADMIN assigns and closes.
 * No DC/TA involvement. Not subject to DC/TA approval workflow.
 */
@Entity
@Table(
    name = "observations",
    indexes = {
        @Index(name = "idx_obs_temple_id",     columnList = "temple_id"),
        @Index(name = "idx_obs_status",        columnList = "status"),
        @Index(name = "idx_obs_severity",      columnList = "severity"),
        @Index(name = "idx_obs_raised_by",     columnList = "raised_by_user_id"),
        @Index(name = "idx_obs_entity",        columnList = "entity_type, entity_id")
    }
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Observation extends BaseEntity {

    @Column(name = "temple_id", nullable = false)
    private Long templeId;

    /** TEMPLE, DECLARATION, TRUST, EMPLOYEE, CONTRACTOR, etc. */
    @Column(name = "entity_type", length = 40, nullable = false)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "title", length = 255, nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", length = 20, nullable = false)
    private ObservationSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private ObservationStatus status = ObservationStatus.OPEN;

    @Column(name = "raised_by_user_id", nullable = false)
    private Long raisedByUserId;

    @Column(name = "assigned_to_user_id")
    private Long assignedToUserId;

    /** JSON array of document IDs attached as evidence. */
    @Column(name = "evidence_document_ids", columnDefinition = "JSON")
    private String evidenceDocumentIds;

    @Column(name = "resolution_note", columnDefinition = "TEXT")
    private String resolutionNote;

    @Column(name = "closed_at")
    private java.time.LocalDateTime closedAt;
}
