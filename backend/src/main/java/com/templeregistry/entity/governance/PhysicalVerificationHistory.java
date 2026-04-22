package com.templeregistry.entity.governance;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Append-only audit trail for physical verification status changes on Asset Declarations.
 *
 * VISIBILITY: DC ONLY — must NEVER be returned to Temple Authority.
 * Does NOT extend BaseEntity — immutable once written.
 */
@Entity
@Table(name = "physical_verification_history", indexes = {
        @Index(name = "idx_pvh_declaration_id", columnList = "declaration_id"),
        @Index(name = "idx_pvh_dc_user_id",     columnList = "dc_user_id")
})
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PhysicalVerificationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "declaration_id", nullable = false)
    private Long declarationId;

    @Column(name = "dc_user_id", nullable = false)
    private Long dcUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", nullable = false, length = 50)
    private PhysicalVerificationStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 50)
    private PhysicalVerificationStatus newStatus;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "occurred_at", nullable = false, updatable = false)
    private LocalDateTime occurredAt;
}
