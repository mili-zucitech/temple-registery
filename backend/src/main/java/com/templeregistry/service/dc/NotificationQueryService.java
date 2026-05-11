package com.templeregistry.service.dc;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.response.notification.NotificationResponse;
import com.templeregistry.security.ScopeHelper;

public interface NotificationQueryService {

    PaginatedResponse<NotificationResponse> listNotifications(int page, int size, ScopeHelper.Claims claims);

    void markRead(Long notificationId, ScopeHelper.Claims claims);

    int markAllRead(ScopeHelper.Claims claims);

    long countUnread(ScopeHelper.Claims claims);

    /** Soft-delete a single notification. Only the owning user may delete it. */
    void deleteNotification(Long notificationId, ScopeHelper.Claims claims);

    /** Soft-delete all notifications for the current user. Returns count deleted. */
    int clearAll(ScopeHelper.Claims claims);
}
