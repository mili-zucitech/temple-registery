package com.templeregistry.entity.audit;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "governance_action_history", indexes = {
        @Index(name = "idx_gov_action_entity", columnList = "entity_type, entity_id"),
        @Index(name = "idx_gov_action_dc_user", columnList = "dc_user_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GovernanceActionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    // e.g., "TEMPLE", "TRUST", "EMPLOYEE", "CONTRACTOR", "DECLARATION"
    @Column(name = "entity_type", nullable = false, length = 64)
    private String entityType;

    @Column(name = "workflow_instance_id")
    private Long workflowInstanceId;

    @Column(name = "workflow_transition_id")
    private Long workflowTransitionId;

    @Column(name = "dc_user_id", nullable = false)
    private Long dcUserId;

    // e.g., "VERIFY", "FLAG", "QUERY", "APPROVE", "REJECT"
    @Column(name = "action", nullable = false, length = 64)
    private String action;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    /**
     * Legacy column — present in DB from old schema, kept here so Hibernate
     * does not fail on insert. Not used by application logic.
     */
    @Builder.Default
    @Column(name = "governance_version", nullable = false)
    private Long governanceVersion = 1L;

    /**
     * Role of the actor who performed the action.
     * Added in V42 migration.
     */
    @Column(name = "actor_role", length = 32)
    private String actorRole;

    @CreationTimestamp
    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;
}
