package com.templeregistry.event.listener;

import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.service.notification.NotificationDispatchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Centralized event listener for all notification-triggering domain events.
 * Listens to any subclass of {@link BaseNotificationEvent} and dispatches notifications
 * via {@link NotificationDispatchService}.
 *
 * This listener is @Async to ensure event publishing does not block the main transaction.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    private final NotificationDispatchService notificationDispatchService;

    /**
     * Handles all notification events by dispatching to the notification service.
     * Runs asynchronously to avoid blocking the caller's transaction.
     */
    @EventListener
    @Async("taskExecutor")
    public void handleNotificationEvent(BaseNotificationEvent event) {
        try {
            log.info("Processing notification event: type=[{}] entityId=[{}] priority=[{}]",
                    event.getClass().getSimpleName(), event.getEntityId(), event.getPriority());

            notificationDispatchService.dispatch(event);

            log.info("Notification event processed successfully: type=[{}] entityId=[{}]",
                    event.getClass().getSimpleName(), event.getEntityId());
        } catch (Exception ex) {
            log.error("Failed to process notification event: type=[{}] entityId=[{}]",
                    event.getClass().getSimpleName(), event.getEntityId(), ex);
            // Do not rethrow — notification failures should not break the main workflow
        }
    }
}
