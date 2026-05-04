package com.templeregistry.controller.notification;

import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.notification.impl.SseNotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * SSE endpoint for real-time notification push.
 * Clients connect to GET /api/v1/notifications/stream to receive live updates.
 */
@RestController
@RequestMapping("/api/v1/notifications")
@PreAuthorize("isAuthenticated()")
@Tag(name = "Notifications SSE", description = "Real-time notification push via Server-Sent Events")
public class NotificationSseController {

    private final SseNotificationService sseNotificationService;

    public NotificationSseController(SseNotificationService sseNotificationService) {
        this.sseNotificationService = sseNotificationService;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "SSE stream for real-time notification push")
    public SseEmitter stream() {
        Long userId = currentUserId();
        return sseNotificationService.subscribe(userId);
    }

    private Long currentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return principal instanceof ScopeHelper.Claims c ? c.userId() : 0L;
    }
}
