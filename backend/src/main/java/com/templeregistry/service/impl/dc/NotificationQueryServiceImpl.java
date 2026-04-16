package com.templeregistry.service.impl.dc;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.response.notification.NotificationResponse;
import com.templeregistry.entity.notification.InAppNotification;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.notification.InAppNotificationRepository;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.dc.NotificationQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationQueryServiceImpl implements NotificationQueryService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final int DEFAULT_PAGE_SIZE = 20;

    private final InAppNotificationRepository notificationRepository;

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.CAN_READ_ALL)
    public PaginatedResponse<NotificationResponse> listNotifications(int page, int size,
                                                                      ScopeHelper.Claims claims) {
        int clampedSize = Math.min(size, MAX_PAGE_SIZE);
        return PaginatedResponse.of(
                notificationRepository
                        .findAllByUserIdOrderByCreatedAtDesc(claims.userId(), PageRequest.of(page, clampedSize))
                        .map(this::toResponse));
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_WRITE_DC)
    public void markRead(Long notificationId, ScopeHelper.Claims claims) {
        InAppNotification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("InAppNotification", notificationId));

        if (!notification.getUserId().equals(claims.userId())) {
            // Return 404 — do not reveal that the notification belongs to another user
            throw new EntityNotFoundException("InAppNotification", notificationId);
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
            log.debug("Notification [{}] marked read by userId={}", notificationId, claims.userId());
        }
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_WRITE_DC)
    public int markAllRead(ScopeHelper.Claims claims) {
        int count = notificationRepository.markAllRead(claims.userId());
        log.debug("Marked {} notifications as read for userId={}", count, claims.userId());
        return count;
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.CAN_READ_ALL)
    public long countUnread(ScopeHelper.Claims claims) {
        return notificationRepository.countByUserIdAndIsRead(claims.userId(), false);
    }

    private NotificationResponse toResponse(InAppNotification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .body(n.getBody())
                .referenceType(n.getReferenceType())
                .referenceId(n.getReferenceId())
                .read(n.isRead())
                .readAt(n.getReadAt())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
