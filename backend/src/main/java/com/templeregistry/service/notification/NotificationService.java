package com.templeregistry.service.notification;

import com.templeregistry.dto.response.notification.NotificationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    /**
     * Dispatch an in-app notification to the given user (legacy fire-and-forget).
     * Prefer {@link #createInAppNotification} for workflow-aware delivery.
     */
    void notify(Long recipientId, String title, String body, String referenceType, Long referenceId);

    void markRead(Long notificationId, Long userId);

    int markAllRead(Long userId);

    Page<NotificationResponse> listNotifications(Long userId, Pageable pageable);

    long countUnread(Long userId);

    void acknowledge(Long notificationId, Long userId);

    /** Soft-delete a single notification. Only the owning user may delete it. */
    void deleteNotification(Long notificationId, Long userId);

    /** Soft-delete all notifications for the given user. Returns count deleted. */
    int clearAll(Long userId);

    /**
     * Create a persisted in-app notification with full workflow-aware context.
     * Used by {@code NotificationDispatchServiceImpl} (v2 workflow engine pipeline).
     */
    void createInAppNotification(
            Long recipientId,
            String title,
            String body,
            String priority,
            String notificationType,
            String entityType,
            Long entityId,
            Long workflowInstanceId,
            Long templeId,
            String templeName,
            String actionByName,
            String actionByRole,
            String redirectUrl,
            String workflowStatus
    );
}


