package com.templeregistry.entity.notification;

import com.templeregistry.entity.base.BaseEntity;
import com.templeregistry.event.base.ModuleType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

/**
 * User notification preferences per module.
 * Allows users to configure whether they want in-app and/or email notifications
 * for each module (TEMPLE, TRUST, EMPLOYEE, etc.).
 */
@Entity
@Table(name = "user_notification_preferences", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_module", columnNames = {"user_id", "module_type"})
})
@SQLRestriction("1=1")  // No soft delete for preferences
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreference extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "module_type", nullable = false, length = 30)
    private ModuleType moduleType;

    @Builder.Default
    @Column(name = "in_app_enabled", nullable = false)
    private boolean inAppEnabled = true;

    @Builder.Default
    @Column(name = "email_enabled", nullable = false)
    private boolean emailEnabled = true;
}
