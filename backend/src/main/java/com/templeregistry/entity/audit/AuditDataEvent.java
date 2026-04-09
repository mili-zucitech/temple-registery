package com.templeregistry.entity.audit;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Append-only record of every data mutation (CREATE/UPDATE/DELETE).
 * Does NOT extend BaseEntity — immutable once written.
 */
@Entity
@Table(name = "audit_data_events", indexes = {
        @Index(name = "idx_ade_actor_id", columnList = "actor_id"),
        @Index(name = "idx_ade_entity", columnList = "entity_type, entity_id")
})
@Getter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditDataEvent {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_id", nullable = false)
    private Long actorId;

    @Column(name = "actor_role", nullable = false, length = 32)
    private String actorRole;

    @Column(name = "action", nullable = false, length = 32) // CREATE, UPDATE, DELETE
    private String action;

    @Column(name = "entity_type", nullable = false, length = 64)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "detail", columnDefinition = "TEXT")
    private String detail;

    @CreationTimestamp
    @Column(name = "occurred_at", nullable = false, updatable = false)
    private LocalDateTime occurredAt;
}
