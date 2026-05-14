package com.templeregistry.event.base;

import com.templeregistry.entity.auth.UserRole;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.time.LocalDateTime;

/**
 * Base class for all notification-triggering domain events.
 * Extends Spring's ApplicationEvent to integrate with @EventListener.
 */
@Getter
public abstract class BaseNotificationEvent extends ApplicationEvent {

    private final Long entityId;
    private final String entityType;
    private final Long actorId;
    private final UserRole actorRole;
    private final LocalDateTime occurredAt;
    private final NotificationPriority priority;
    private final NotificationCategory category;

    protected BaseNotificationEvent(
            Object source,
            Long entityId,
            String entityType,
            Long actorId,
            UserRole actorRole,
            NotificationPriority priority,
            NotificationCategory category) {
        super(source);
        this.entityId = entityId;
        this.entityType = entityType;
        this.actorId = actorId;
        this.actorRole = actorRole;
        this.occurredAt = LocalDateTime.now();
        this.priority = priority;
        this.category = category;
    }

    /**
     * Returns the user ID(s) who should receive notifications for this event.
     * Subclasses must implement this to define notification recipients.
     */
    public abstract Long[] getRecipientIds();

    /**
     * Returns a human-readable notification title.
     */
    public abstract String getNotificationTitle();

    /**
     * Returns a human-readable notification body/message.
     */
    public abstract String getNotificationBody();

    /**
     * Returns the action URL for deep linking (e.g., "/declarations/123").
     */
    public abstract String getActionUrl();
}
