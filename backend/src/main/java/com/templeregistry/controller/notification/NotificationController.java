package com.templeregistry.controller.notification;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.response.notification.NotificationResponse;
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
    private final PaginationUtil paginationUtil;

    @GetMapping
    @Operation(summary = "List notifications for the current user (paginated, newest first)")
    public ResponseEntity<ApiResponse<PaginatedResponse<NotificationResponse>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = currentUserId();
        Page<NotificationResponse> result = notificationService
            .listNotifications(userId, PageRequest.of(page, paginationUtil.clampSize(size)));
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

    @PostMapping("/{id}/acknowledge")
    @Operation(summary = "Acknowledge a notification that requires acknowledgement")
    public ResponseEntity<ApiResponse<Void>> acknowledge(@PathVariable Long id) {
        notificationService.acknowledge(id, currentUserId());
        return ResponseEntity.ok(ApiResponse.success("Notification acknowledged."));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete a single notification")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id, currentUserId());
        return ResponseEntity.ok(ApiResponse.success("Notification deleted."));
    }

    @DeleteMapping("/clear-all")
    @Operation(summary = "Soft-delete all notifications for the current user")
    public ResponseEntity<ApiResponse<Integer>> clearAll() {
        int count = notificationService.clearAll(currentUserId());
        return ResponseEntity.ok(ApiResponse.success(count + " notification(s) cleared.", count));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Returns the count of unread notifications for the current user")
    public ResponseEntity<ApiResponse<Long>> unreadCount() {
        long count = notificationService.countUnread(currentUserId());
        return ResponseEntity.ok(ApiResponse.success("Unread count retrieved.", count));
    }

    private Long currentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return principal instanceof ScopeHelper.Claims c ? c.userId() : 0L;
    }
}
