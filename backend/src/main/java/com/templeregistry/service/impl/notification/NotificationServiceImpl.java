package com.templeregistry.service.impl.notification;

import com.templeregistry.entity.notification.InAppNotification;
import com.templeregistry.entity.notification.NotificationEvent;
import com.templeregistry.dto.response.notification.NotificationResponse;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.notification.InAppNotificationRepository;
import com.templeregistry.repository.notification.NotificationEventRepository;
import com.templeregistry.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async; // still used by notify()
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
    @Async("taskExecutor")
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

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> listNotifications(Long userId, Pageable pageable) {
        return inAppRepository.findAllByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId, pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public long countUnread(Long userId) {
        return inAppRepository.countByUserIdAndIsReadAndDeletedAtIsNull(userId, false);
    }

    @Override
    @Transactional
    public void acknowledge(Long notificationId, Long userId) {
        InAppNotification notification = inAppRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("InAppNotification", notificationId));
        if (!notification.getUserId().equals(userId)) {
            throw new IllegalStateException("Cannot acknowledge notification belonging to another user.");
        }
        notification.setAcknowledgedAt(LocalDateTime.now());
        notification.setAcknowledgedBy(userId);
        inAppRepository.save(notification);
        log.info("Notification acknowledged: id=[{}] by userId=[{}]", notificationId, userId);
    }

    @Override
    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        int updated = inAppRepository.softDeleteById(notificationId, userId);
        if (updated == 0) {
            throw new EntityNotFoundException("Notification", notificationId);
        }
        log.debug("Notification [{}] soft-deleted by userId=[{}]", notificationId, userId);
    }

    @Override
    @Transactional
    public int clearAll(Long userId) {
        int count = inAppRepository.softDeleteAllByUserId(userId);
        log.info("Cleared {} notification(s) for userId=[{}]", count, userId);
        return count;
    }

    /**
     * Full workflow-aware in-app notification persistence.
     * Idempotency key includes notificationType so SUBMIT and APPROVE for the same entity both persist.
     * NOT @Async — runs within the caller's REQUIRES_NEW transaction.
     */
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createInAppNotification(
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
            String workflowStatus) {
        if (recipientId == null) {
            log.warn("[FLOW_4] createInAppNotification called with null recipientId — skipping");
            return;
        }
        String idempotencyKey = String.join("|",
                String.valueOf(recipientId),
                notificationType != null ? notificationType : entityType,
                String.valueOf(entityId),
                String.valueOf(workflowInstanceId));
        log.info("[FLOW_4] saving in_app recipientId={} type={} entityId={} key={}",
                recipientId, notificationType, entityId, idempotencyKey);
        if (inAppRepository.existsByIdempotencyKey(idempotencyKey)) {
            log.info("[FLOW_5] dedup skip — in_app already exists for key={}", idempotencyKey);
            return;
        }
        InAppNotification saved = inAppRepository.save(InAppNotification.builder()
                .userId(recipientId)
                .title(title)
                .body(body)
                .priority(priority)
                .notificationType(notificationType)
                .referenceType(entityType)
                .referenceId(entityId)
                .workflowInstanceId(workflowInstanceId)
                .templeId(templeId)
                .templeName(templeName)
                .actionByName(actionByName)
                .actionByRole(actionByRole)
                .redirectUrl(redirectUrl)
                .workflowStatus(workflowStatus)
                .idempotencyKey(idempotencyKey)
                .isRead(false)
                .build());
        log.info("[FLOW_5] saved id={} recipientId={} type={} entityId={}",
                saved.getId(), recipientId, notificationType, entityId);
        eventRepository.save(NotificationEvent.builder()
                .recipientId(recipientId)
                .eventType(notificationType != null ? notificationType : entityType + "_WORKFLOW")
                .referenceId(entityId)
                .referenceType(entityType)
                .channel("IN_APP")
                .status("SENT")
                .build());
    }

    private NotificationResponse toResponse(InAppNotification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .notificationType(n.getNotificationType())
                .title(n.getTitle())
                .body(n.getBody())
                .priority(n.getPriority())
                .category(n.getCategory())
                .actionUrl(n.getActionUrl())
                .redirectUrl(n.getRedirectUrl())
                .referenceType(n.getReferenceType())
                .referenceId(n.getReferenceId())
                .workflowInstanceId(n.getWorkflowInstanceId())
                .templeId(n.getTempleId())
                .templeName(n.getTempleName())
                .actionByName(n.getActionByName())
                .actionByRole(n.getActionByRole())
                .workflowStatus(n.getWorkflowStatus())
                .read(n.isRead())
                .readAt(n.getReadAt())
                .createdAt(n.getCreatedAt())
                .build();
    }
}

