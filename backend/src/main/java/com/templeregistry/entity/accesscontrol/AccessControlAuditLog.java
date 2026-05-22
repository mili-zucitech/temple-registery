package com.templeregistry.entity.accesscontrol;

import com.templeregistry.entity.accesscontrol.enums.AuditChangeType;
import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

/**
 * Immutable audit trail for every DACVM policy or field-mask change.
 * Append-only — records are never mutated after creation.
 */
@Entity
@Table(
    name = "access_control_audit_log",
    indexes = {
        @Index(name = "idx_acal_policy_id",   columnList = "policy_id"),
        @Index(name = "idx_acal_changed_by",  columnList = "changed_by_user_id"),
        @Index(name = "idx_acal_changed_at",  columnList = "changed_at"),
        @Index(name = "idx_acal_change_type", columnList = "change_type")
    }
)
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE access_control_audit_log SET is_deleted = true, updated_at = NOW(6) WHERE id = ?")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class AccessControlAuditLog extends BaseEntity {

    /** FK to access_control_policies — null for field-mask changes. */
    @Column(name = "policy_id")
    private Long policyId;

    /** FK to access_control_field_masks — null for policy changes. */
    @Column(name = "field_mask_id")
    private Long fieldMaskId;

    @Column(name = "changed_by_user_id", nullable = false)
    private Long changedByUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "change_type", length = 20, nullable = false)
    private AuditChangeType changeType;

    /** Snapshot of the entity state before the change (JSON). */
    @Column(name = "old_value", columnDefinition = "json")
    private String oldValue;

    /** Snapshot of the entity state after the change (JSON). */
    @Column(name = "new_value", columnDefinition = "json")
    private String newValue;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;
}
