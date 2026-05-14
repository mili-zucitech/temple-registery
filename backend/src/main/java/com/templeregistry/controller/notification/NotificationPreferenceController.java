package com.templeregistry.controller.notification;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.dto.request.notification.UpdatePreferencesRequest;
import com.templeregistry.dto.response.notification.NotificationPreferenceResponse;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.notification.NotificationPreferenceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notification-preferences")
@RequiredArgsConstructor
@Tag(name = "Notification Preferences", description = "Manage user notification preferences")
@PreAuthorize("isAuthenticated()")
public class NotificationPreferenceController {

    private final NotificationPreferenceService preferenceService;

    @GetMapping
    @Operation(summary = "Get current user's notification preferences")
    public ResponseEntity<ApiResponse<List<NotificationPreferenceResponse>>> getPreferences() {
        Long userId = currentUserId();
        List<NotificationPreferenceResponse> preferences = preferenceService.getUserPreferences(userId);
        return ResponseEntity.ok(ApiResponse.success("Preferences retrieved.", preferences));
    }

    @PutMapping
    @Operation(summary = "Update current user's notification preferences")
    public ResponseEntity<ApiResponse<List<NotificationPreferenceResponse>>> updatePreferences(
            @Valid @RequestBody UpdatePreferencesRequest request) {
        Long userId = currentUserId();
        List<NotificationPreferenceResponse> preferences = preferenceService.updatePreferences(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Preferences updated successfully.", preferences));
    }

    private Long currentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return principal instanceof ScopeHelper.Claims c ? c.userId() : 0L;
    }
}
