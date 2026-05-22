package com.templeregistry.entity.accesscontrol;

import com.templeregistry.entity.accesscontrol.enums.PolicyEffect;
import com.templeregistry.entity.accesscontrol.enums.SubjectType;
import com.templeregistry.entity.accesscontrol.enums.TargetType;
import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

/**
 * A single dynamic access-control policy entry managed by SUPER_ADMIN.
 *
 * <p>Evaluation rules:</p>
 * <ul>
 *   <li>USER-level DENY overrides any ROLE-level policy.</li>
 *   <li>ROLE-level DENY overrides ROLE-level ALLOW.</li>
 *   <li>No matching active policy → default ALLOW (structural @PreAuthorize is the floor).</li>
 *   <li>SUPER_ADMIN is exempt from all DENY policies.</li>
 * </ul>
 */
@Entity
@Table(
    name = "access_control_policies",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_acp_target_subject",
            columnNames = {"target_key", "subject_type", "subject_value"})
    },
    indexes = {
        @Index(name = "idx_acp_target_key", columnList = "target_key"),
        @Index(name = "idx_acp_subject",    columnList = "subject_type, subject_value"),
        @Index(name = "idx_acp_active",     columnList = "is_active"),
        @Index(name = "idx_acp_deleted",    columnList = "is_deleted")
    }
)
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE access_control_policies SET is_deleted = true, updated_at = NOW(6) WHERE id = ?")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class AccessControlPolicy extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", length = 30, nullable = false)
    private TargetType targetType;

    /** Namespaced key uniquely identifying a UI element or API action. */
    @Column(name = "target_key", length = 255, nullable = false)
    private String targetKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "subject_type", length = 10, nullable = false)
    private SubjectType subjectType;

    /** Role name (e.g. TEMPLE_AUTHORITY) or user ID as string. */
    @Column(name = "subject_value", length = 100, nullable = false)
    private String subjectValue;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "effect", length = 10, nullable = false)
    private PolicyEffect effect = PolicyEffect.ALLOW;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    /** Reserved for future contextual rule expressions (SpEL / CEL). Stored as JSON. */
    @Column(name = "conditions", columnDefinition = "json")
    private String conditions;
}
