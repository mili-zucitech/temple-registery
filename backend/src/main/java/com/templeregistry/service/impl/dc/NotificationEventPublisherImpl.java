package com.templeregistry.service.impl.dc;

import com.templeregistry.entity.notification.NotificationEvent;
import com.templeregistry.repository.notification.NotificationEventRepository;
import com.templeregistry.service.dc.NotificationEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Inserts a notification_events row synchronously, within the caller's transaction.
 *
 * Propagation = REQUIRED means this joins the outer DC workflow transaction.
 * If the workflow transaction rolls back, this notification row also rolls back.
 * This is the desired behavior — atomicity between status change and event.
 *
 * dc_e2e Section 2.8.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationEventPublisherImpl implements NotificationEventPublisher {

    private final NotificationEventRepository notificationEventRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void publish(Long recipientId, String eventType, Long referenceId, String referenceType) {
        NotificationEvent event = NotificationEvent.builder()
                .recipientId(recipientId)
                .eventType(eventType)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .channel("IN_APP")
                .status("PENDING")
                .build();

        notificationEventRepository.save(event);
        log.debug("NotificationEvent persisted: recipientId={} eventType={} ref={}:{}",
                recipientId, eventType, referenceType, referenceId);
    }
}
