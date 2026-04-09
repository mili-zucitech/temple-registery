package com.templeregistry.entity.audit;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/** Audit record for every data export (CSV/PDF) triggered by a user. */
@Entity
@Table(name = "audit_export_events", indexes = {
        @Index(name = "idx_aee_actor_id", columnList = "actor_id"),
        @Index(name = "idx_aee_export_type", columnList = "export_type")
})
@Getter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditExportEvent {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_id", nullable = false)
    private Long actorId;

    @Column(name = "actor_role", nullable = false, length = 32)
    private String actorRole;

    @Column(name = "export_type", nullable = false, length = 32) // TEMPLES_CSV, DECLARATIONS_PDF, etc.
    private String exportType;

    @Column(name = "filter_summary", columnDefinition = "TEXT")
    private String filterSummary;

    @Column(name = "record_count")
    private Integer recordCount;

    @CreationTimestamp
    @Column(name = "occurred_at", nullable = false, updatable = false)
    private LocalDateTime occurredAt;
}
