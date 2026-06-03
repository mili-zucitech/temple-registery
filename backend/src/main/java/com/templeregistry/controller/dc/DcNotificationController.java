package com.templeregistry.controller.dc;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.response.notification.NotificationResponse;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.dc.NotificationQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dc/notifications")
@RequiredArgsConstructor
@Tag(name = "DC Notifications", description = "DC portal in-app notification inbox")
@PreAuthorize(RoleConstants.CAN_READ_ALL)
public class DcNotificationController {

    private final NotificationQueryService notificationQueryService;

    @GetMapping
    @Operation(summary = "Returns the paginated in-app notification inbox for the current DC user, newest first.")
    public ResponseEntity<ApiResponse<PaginatedResponse<NotificationResponse>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PaginatedResponse<NotificationResponse> result =
                notificationQueryService.listNotifications(page, size, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved.", result));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Returns the count of unread notifications for the current user. Used by the frontend badge counter.")
    public ResponseEntity<ApiResponse<Long>> unreadCount() {
        long count = notificationQueryService.countUnread(currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Unread count retrieved.", count));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Marks a single notification as read. Only the owning user may perform this action.")
    public ResponseEntity<ApiResponse<Void>> markRead(@PathVariable Long id) {
        notificationQueryService.markRead(id, currentClaims());
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read."));
    }

    @PostMapping("/read-all")
    @Operation(summary = "Marks all unread notifications as read for the current user.")
    public ResponseEntity<ApiResponse<Integer>> markAllRead() {
        int count = notificationQueryService.markAllRead(currentClaims());
        return ResponseEntity.ok(ApiResponse.success(count + " notification(s) marked as read.", count));
    }

    private ScopeHelper.Claims currentClaims() {
        return (ScopeHelper.Claims) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
