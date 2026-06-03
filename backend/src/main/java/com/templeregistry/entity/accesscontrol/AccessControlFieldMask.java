package com.templeregistry.entity.accesscontrol;

import com.templeregistry.entity.accesscontrol.enums.SubjectType;
import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

/**
 * Field-level masking configuration.
 * When {@code maskEnabled = true} for a given role or user, the field value is
 * replaced by {@code maskPattern} in API responses.
 */
@Entity
@Table(
    name = "access_control_field_masks",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_acfm_field_subject",
            columnNames = {"field_key", "subject_type", "subject_value"})
    },
    indexes = {
        @Index(name = "idx_acfm_field_key", columnList = "field_key"),
        @Index(name = "idx_acfm_subject",   columnList = "subject_type, subject_value"),
        @Index(name = "idx_acfm_deleted",   columnList = "is_deleted")
    }
)
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE access_control_field_masks SET is_deleted = true, updated_at = NOW(6) WHERE id = ?")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class AccessControlFieldMask extends BaseEntity {

    /** Namespaced field key, e.g. {@code field.temple.bank_account}. */
    @Column(name = "field_key", length = 255, nullable = false)
    private String fieldKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "subject_type", length = 10, nullable = false)
    private SubjectType subjectType;

    @Column(name = "subject_value", length = 100, nullable = false)
    private String subjectValue;

    @Builder.Default
    @Column(name = "mask_enabled", nullable = false)
    private boolean maskEnabled = true;

    /** Replacement pattern, e.g. {@code ****} or {@code XXXX-XXXX-####}. */
    @Builder.Default
    @Column(name = "mask_pattern", length = 50, nullable = false)
    private String maskPattern = "****";

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
