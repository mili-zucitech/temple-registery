package com.templeregistry.service.notification;

import com.templeregistry.event.base.BaseNotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

/**
 * Helper service for publishing notification events.
 * Provides a clean API for services to trigger notifications without directly
 * depending on Spring's ApplicationEventPublisher.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationEventPublisher {

    private final ApplicationEventPublisher eventPublisher;

    /**
     * Publishes a notification event to be processed asynchronously by event listeners.
     *
     * @param event the notification event to publish
     */
    public void publish(BaseNotificationEvent event) {
        try {
            log.debug("Publishing notification event: type=[{}] entityId=[{}] priority=[{}]",
                    event.getClass().getSimpleName(), event.getEntityId(), event.getPriority());
            eventPublisher.publishEvent(event);
        } catch (Exception ex) {
            log.error("Failed to publish notification event: type=[{}] entityId=[{}]",
                    event.getClass().getSimpleName(), event.getEntityId(), ex);
            // Do not rethrow — event publishing failures should not break the main workflow
        }
    }
}
