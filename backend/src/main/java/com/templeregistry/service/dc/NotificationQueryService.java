package com.templeregistry.service.dc;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.response.notification.NotificationResponse;
import com.templeregistry.security.ScopeHelper;

public interface NotificationQueryService {

    /**
     * Returns the paginated in-app notification inbox for the current DC principal.
     * Ordered by createdAt DESC.
     * dc_e2e Section 5.1.
     */
    PaginatedResponse<NotificationResponse> listNotifications(int page, int size, ScopeHelper.Claims claims);

    /**
     * Marks a single notification as read. Only the owning user may perform this action.
     * dc_e2e Section 5.1.
     */
    void markRead(Long notificationId, ScopeHelper.Claims claims);

    /**
     * Marks all unread notifications for the current user as read.
     * Returns count of notifications marked.
     * dc_e2e Section 5.1.
     */
    int markAllRead(ScopeHelper.Claims claims);

    /**
     * Returns the count of unread notifications for the current user.
     * Used by frontend badge counter.
     */
    long countUnread(ScopeHelper.Claims claims);
}
