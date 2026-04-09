package com.templeregistry.repository.notification;

import com.templeregistry.entity.notification.NotificationEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationEventRepository extends JpaRepository<NotificationEvent, Long> {
}
