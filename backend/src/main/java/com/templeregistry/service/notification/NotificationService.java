package com.templeregistry.service.notification;

public interface NotificationService {

    /**
     * Dispatch an in-app notification to the given user.
     * Creates both an {@link com.templeregistry.entity.notification.InAppNotification} inbox entry
     * and a {@link com.templeregistry.entity.notification.NotificationEvent} audit record.
     * Fire-and-forget: method is {@code @Async}.
     */
    void notify(Long recipientId, String title, String body, String referenceType, Long referenceId);

    void markRead(Long notificationId, Long userId);

    int markAllRead(Long userId);
}
