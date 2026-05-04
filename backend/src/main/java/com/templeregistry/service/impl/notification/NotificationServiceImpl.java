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
        return inAppRepository.findAllByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public long countUnread(Long userId) {
        return inAppRepository.countByUserIdAndIsRead(userId, false);
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

    /**
     * Full implementation of createInAppNotification() for v2 workflow engine pipeline.
     * Persists workflowInstanceId on InAppNotification for frontend deep-link.
     *
     * NOT @Async — must run synchronously within the dispatch() REQUIRES_NEW transaction
     * so that any save failure is immediately visible to the caller and not silently dropped.
     */
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createInAppNotification(Long recipientId, String title, String body,
                                         String priority, String entityType,
                                         Long entityId, Long workflowInstanceId) {
        if (recipientId == null) {
            log.warn("[FLOW_4] createInAppNotification called with null recipientId — skipping");
            return;
        }
        // Compute a stable idempotency key so the deduplication guard and unique index are effective.
        String idempotencyKey = String.join("|",
            String.valueOf(recipientId), entityType,
            String.valueOf(entityId), String.valueOf(workflowInstanceId));
        log.info("[FLOW_4] saving in_app recipientId={} entityType={} entityId={} wfInstanceId={} idempotencyKey={}",
            recipientId, entityType, entityId, workflowInstanceId, idempotencyKey);
        try {
            InAppNotification saved = inAppRepository.save(InAppNotification.builder()
                    .userId(recipientId)
                    .title(title)
                    .body(body)
                    .referenceType(entityType)
                    .referenceId(entityId)
                    .workflowInstanceId(workflowInstanceId)
                    .idempotencyKey(idempotencyKey)
                    .isRead(false)
                    .build());
            log.info("[FLOW_5] save success id={} recipientId={} entityType={} entityId={}",
                saved.getId(), recipientId, entityType, entityId);
            eventRepository.save(NotificationEvent.builder()
                    .recipientId(recipientId)
                    .eventType(entityType + "_WORKFLOW")
                    .referenceId(entityId)
                    .referenceType(entityType)
                    .channel("IN_APP")
                    .status("SENT")
                    .build());
        } catch (org.springframework.dao.DataIntegrityViolationException dedupEx) {
            // Duplicate idempotency_key — this notification was already delivered (fast-path or retry).
            log.info("[FLOW_5] dedup skip — in_app already exists for key={}: {}", idempotencyKey, dedupEx.getMessage());
        } catch (Exception ex) {
            // Log the exact cause; do NOT attempt a DB write here — the session may be
            // marked rollback-only after the failed save, which would throw a second exception.
            log.error("[FLOW_5] FAILED saving in_app recipientId={} entityType={} entityId={} cause={}",
                recipientId, entityType, entityId, ex.getMessage(), ex);
            // Re-throw so the caller (dispatch try-catch) can log the failure at the dispatch level.
            throw ex;
        }
    }

    private NotificationResponse toResponse(InAppNotification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .body(n.getBody())
                .priority(n.getPriority())
                .category(n.getCategory())
                .actionUrl(n.getActionUrl())
                .referenceType(n.getReferenceType())
                .referenceId(n.getReferenceId())
                .workflowInstanceId(n.getWorkflowInstanceId())
                .read(n.isRead())
                .readAt(n.getReadAt())
                .createdAt(n.getCreatedAt())
                .build();
    }
}

