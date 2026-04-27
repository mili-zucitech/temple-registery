package com.templeregistry.repository.notification;

import com.templeregistry.entity.notification.NotificationPreference;
import com.templeregistry.event.base.ModuleType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, Long> {

    List<NotificationPreference> findAllByUserId(Long userId);

    Optional<NotificationPreference> findByUserIdAndModuleType(Long userId, ModuleType moduleType);

    boolean existsByUserIdAndModuleType(Long userId, ModuleType moduleType);
}
