package com.templeregistry.entity.config;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

/**
 * Key-value system configuration store for SUPER_ADMIN managed settings.
 *
 * Categories:
 *   SLA       — workflow deadline overrides (e.g. declaration_review_days = 30)
 *   NOTIFICATION — notification channel/preference defaults
 *   FEATURE    — feature flags
 */
@Entity
@Table(
    name = "system_config",
    indexes = {
        @Index(name = "idx_sc_key", columnList = "config_key", unique = true),
        @Index(name = "idx_sc_category", columnList = "category"),
        @Index(name = "idx_sc_active", columnList = "is_active")
    }
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class SystemConfig extends BaseEntity {

    @Column(name = "config_key", length = 100, nullable = false, unique = true)
    private String configKey;

    @Column(name = "config_value", length = 1000, nullable = false)
    private String configValue;

    /** STRING, INTEGER, BOOLEAN, JSON */
    @Column(name = "data_type", length = 20, nullable = false)
    private String dataType;

    /** SLA, NOTIFICATION, FEATURE */
    @Column(name = "category", length = 30, nullable = false)
    private String category;

    @Column(name = "description", length = 500)
    private String description;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
