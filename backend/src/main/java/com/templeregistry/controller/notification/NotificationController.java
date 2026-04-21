package com.templeregistry.controller.notification;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.response.notification.NotificationResponse;
import com.templeregistry.entity.notification.InAppNotification;
import com.templeregistry.repository.notification.InAppNotificationRepository;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.notification.NotificationService;
import com.templeregistry.util.PaginationUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app notification inbox")
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationService notificationService;
    private final InAppNotificationRepository notificationRepository;
    private final PaginationUtil paginationUtil;

    @GetMapping
    @Operation(summary = "List notifications for the current user (paginated, newest first)")
    public ResponseEntity<ApiResponse<PaginatedResponse<NotificationResponse>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = currentUserId();
        Page<NotificationResponse> result = notificationRepository
                .findAllByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, paginationUtil.clampSize(size)))
                .map(this::toResponse);
        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved.", PaginatedResponse.of(result)));
    }

    @PostMapping("/{id}/read")
    @Operation(summary = "Mark a single notification as read")
    public ResponseEntity<ApiResponse<Void>> markRead(@PathVariable Long id) {
        notificationService.markRead(id, currentUserId());
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read."));
    }

    @PostMapping("/read-all")
    @Operation(summary = "Mark all notifications as read for the current user")
    public ResponseEntity<ApiResponse<Void>> markAllRead() {
        int count = notificationService.markAllRead(currentUserId());
        return ResponseEntity.ok(ApiResponse.success(count + " notification(s) marked as read."));
    }

    private Long currentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return principal instanceof ScopeHelper.Claims c ? c.userId() : 0L;
    }

    private NotificationResponse toResponse(InAppNotification n) {
        return NotificationResponse.builder()
                .id(n.getId()).title(n.getTitle()).body(n.getBody())
                .referenceType(n.getReferenceType()).referenceId(n.getReferenceId())
                .read(n.isRead()).readAt(n.getReadAt()).createdAt(n.getCreatedAt()).build();
    }
}
