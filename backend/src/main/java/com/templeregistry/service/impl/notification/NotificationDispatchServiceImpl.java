package com.templeregistry.service.impl.notification;

import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.notification.InAppNotification;
import com.templeregistry.entity.notification.NotificationEvent;
import com.templeregistry.event.base.BaseNotificationEvent;
import com.templeregistry.event.base.ModuleType;
import com.templeregistry.event.base.NotificationPriority;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.notification.InAppNotificationRepository;
import com.templeregistry.repository.notification.NotificationEventRepository;
import com.templeregistry.service.notification.EmailService;
import com.templeregistry.service.notification.NotificationDispatchService;
import com.templeregistry.service.notification.NotificationPreferenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementation of {@link NotificationDispatchService}.
 * Dispatches in-app notifications and email notifications based on user preferences.
 * Phase 2: Integrated with EmailService and NotificationPreferenceService.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationDispatchServiceImpl implements NotificationDispatchService {

    private final InAppNotificationRepository inAppRepository;
    private final NotificationEventRepository eventRepository;
    private final NotificationPreferenceService preferenceService;
    private final EmailService emailService;
    private final UserRepository userRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void dispatch(BaseNotificationEvent event) {
        Long[] recipientIds = event.getRecipientIds();

        if (recipientIds == null || recipientIds.length == 0) {
            log.warn("No recipients for notification event: type=[{}] entityId=[{}]",
                    event.getClass().getSimpleName(), event.getEntityId());
            return;
        }

        for (Long recipientId : recipientIds) {
            if (recipientId == null) {
                log.warn("Null recipient ID in event: type=[{}] entityId=[{}]",
                        event.getClass().getSimpleName(), event.getEntityId());
                continue;
            }

            try {
                ModuleType moduleType = determineModuleType(event.getEntityType());
                Long notificationEventId = null;

                // Dispatch in-app notification if enabled
                if (preferenceService.isInAppEnabled(recipientId, moduleType)) {
                    dispatchInAppNotification(event, recipientId);
                    log.debug("In-app notification dispatched: recipientId=[{}]", recipientId);
                }

                // Log notification event
                notificationEventId = logNotificationEvent(event, recipientId, "IN_APP", "SENT", null);

                // Dispatch email notification if enabled and priority is HIGH or CRITICAL
                if (shouldSendEmail(event, recipientId, moduleType)) {
                    User user = userRepository.findById(recipientId).orElse(null);
                    if (user != null && user.getEmail() != null) {
                        emailService.sendNotificationEmail(user.getEmail(), event, notificationEventId);
                        log.debug("Email notification dispatched: recipientId=[{}] email=[{}]", 
                                recipientId, user.getEmail());
                    } else {
                        log.warn("Cannot send email: user not found or email missing for userId=[{}]", recipientId);
                    }
                }

            } catch (Exception ex) {
                log.error("Failed to dispatch notification to userId=[{}] for event type=[{}]",
                        recipientId, event.getClass().getSimpleName(), ex);
                logNotificationEvent(event, recipientId, "IN_APP", "FAILED", ex.getMessage());
            }
        }
    }

    private void dispatchInAppNotification(BaseNotificationEvent event, Long recipientId) {
        InAppNotification notification = InAppNotification.builder()
                .userId(recipientId)
                .title(event.getNotificationTitle())
                .body(event.getNotificationBody())
                .priority(event.getPriority().name())
                .category(event.getCategory().name())
                .actionUrl(event.getActionUrl())
                .referenceType(event.getEntityType())
                .referenceId(event.getEntityId())
                .isRead(false)
                .build();

        inAppRepository.save(notification);
    }

    private Long logNotificationEvent(
            BaseNotificationEvent event,
            Long recipientId,
            String channel,
            String status,
            String failureReason) {
        NotificationEvent notificationEvent = NotificationEvent.builder()
                .recipientId(recipientId)
                .eventType(event.getClass().getSimpleName())
                .referenceId(event.getEntityId())
                .referenceType(event.getEntityType())
                .channel(channel)
                .status(status)
                .failureReason(failureReason)
                .build();

        NotificationEvent saved = eventRepository.save(notificationEvent);
        return saved.getId();
    }

    /**
     * Determines if an email should be sent based on event priority and user preferences.
     */
    private boolean shouldSendEmail(BaseNotificationEvent event, Long recipientId, ModuleType moduleType) {
        // Check if email is enabled for this module
        if (!preferenceService.isEmailEnabled(recipientId, moduleType)) {
            return false;
        }

        // Only send email for HIGH and CRITICAL priority events
        return event.getPriority() == NotificationPriority.HIGH
                || event.getPriority() == NotificationPriority.CRITICAL;
    }

    /**
     * Maps entity type string to ModuleType enum.
     */
    private ModuleType determineModuleType(String entityType) {
        return switch (entityType) {
            case "TEMPLE" -> ModuleType.TEMPLE;
            case "TRUST" -> ModuleType.TRUST;
            case "EMPLOYEE" -> ModuleType.EMPLOYEE;
            case "CONTRACTOR" -> ModuleType.CONTRACTOR;
            case "DECLARATION" -> ModuleType.DECLARATION;
            case "DOCUMENT" -> ModuleType.DOCUMENT;
            default -> ModuleType.SYSTEM;
        };
    }
}
