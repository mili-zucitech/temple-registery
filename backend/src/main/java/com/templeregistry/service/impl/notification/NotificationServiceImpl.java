package com.templeregistry.service.impl.notification;

import com.templeregistry.entity.notification.InAppNotification;
import com.templeregistry.entity.notification.NotificationEvent;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.notification.InAppNotificationRepository;
import com.templeregistry.repository.notification.NotificationEventRepository;
import com.templeregistry.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final InAppNotificationRepository inAppRepository;
    private final NotificationEventRepository eventRepository;

    @Override
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notify(Long recipientId, String title, String body, String referenceType, Long referenceId) {
        try {
            inAppRepository.save(InAppNotification.builder()
                    .userId(recipientId).title(title).body(body)
                    .referenceType(referenceType).referenceId(referenceId)
                    .isRead(false).build());
            eventRepository.save(NotificationEvent.builder()
                    .recipientId(recipientId).eventType(referenceType)
                    .referenceId(referenceId).referenceType(referenceType)
                    .channel("IN_APP").status("SENT").build());
            log.info("Notification dispatched: recipient=[{}] type=[{}]", recipientId, referenceType);
        } catch (Exception ex) {
            log.error("Failed to dispatch notification to userId=[{}]", recipientId, ex);
            eventRepository.save(NotificationEvent.builder()
                    .recipientId(recipientId).eventType(referenceType).channel("IN_APP")
                    .status("FAILED").failureReason(ex.getMessage()).build());
        }
    }

    @Override
    @Transactional
    public void markRead(Long notificationId, Long userId) {
        InAppNotification n = inAppRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("Notification", notificationId));
        if (!n.getUserId().equals(userId)) {
            throw new com.templeregistry.exception.JurisdictionAccessDeniedException(
                    "Notification does not belong to the current user.");
        }
        n.setRead(true);
        n.setReadAt(LocalDateTime.now());
        inAppRepository.save(n);
    }

    @Override
    @Transactional
    public int markAllRead(Long userId) {
        return inAppRepository.markAllRead(userId);
    }
}
