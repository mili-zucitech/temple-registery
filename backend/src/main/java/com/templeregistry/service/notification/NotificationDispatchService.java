package com.templeregistry.service.notification;

import com.templeregistry.event.base.BaseNotificationEvent;

/**
 * Service responsible for dispatching notifications based on domain events.
 * Handles both in-app and email notifications.
 */
public interface NotificationDispatchService {

    /**
     * Dispatches notifications for the given event to all recipients.
     * Determines notification channels (in-app, email) based on event priority and user preferences.
     *
     * @param event the domain event that triggered the notification
     */
    void dispatch(BaseNotificationEvent event);
}
