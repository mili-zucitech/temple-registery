package com.templeregistry.service.notification;

import com.templeregistry.dto.response.notification.NotificationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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

    Page<NotificationResponse> listNotifications(Long userId, Pageable pageable);

    long countUnread(Long userId);

    void acknowledge(Long notificationId, Long userId);

    /**
     * Create a persisted in-app notification with full governance context.
     * Used by NotificationDispatchService (v2 workflow engine pipeline).
     *
     * @param recipientId         User to notify
     * @param title               Short notification title
     * @param body                Full notification body
     * @param priority            HIGH / MEDIUM / LOW
     * @param entityType          e.g. TRUST, DECLARATION, TEMPLE_PROFILE
     * @param entityId            PK of the entity
     * @param workflowInstanceId  Linked workflow instance (for deep-link on click)
     */
    default void createInAppNotification(Long recipientId, String title, String body,
                                          String priority, String entityType,
                                          Long entityId, Long workflowInstanceId) {
        // Default: delegate to legacy notify() for backward compatibility
        // Override in NotificationServiceImpl to persist workflowInstanceId
        notify(recipientId, title, body, entityType, entityId);
    }
}

