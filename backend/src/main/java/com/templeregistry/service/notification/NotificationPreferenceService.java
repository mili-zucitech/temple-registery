package com.templeregistry.service.notification;

import com.templeregistry.dto.request.notification.UpdatePreferencesRequest;
import com.templeregistry.dto.response.notification.NotificationPreferenceResponse;
import com.templeregistry.event.base.ModuleType;

import java.util.List;

/**
 * Service for managing user notification preferences.
 */
public interface NotificationPreferenceService {

    /**
     * Gets all notification preferences for a user.
     * Creates default preferences if none exist.
     *
     * @param userId the user ID
     * @return list of notification preferences
     */
    List<NotificationPreferenceResponse> getUserPreferences(Long userId);

    /**
     * Updates notification preferences for a user.
     *
     * @param userId the user ID
     * @param request the update request
     * @return updated preferences
     */
    List<NotificationPreferenceResponse> updatePreferences(Long userId, UpdatePreferencesRequest request);

    /**
     * Checks if a user has email notifications enabled for a specific module.
     *
     * @param userId the user ID
     * @param moduleType the module type
     * @return true if email is enabled, false otherwise
     */
    boolean isEmailEnabled(Long userId, ModuleType moduleType);

    /**
     * Checks if a user has in-app notifications enabled for a specific module.
     *
     * @param userId the user ID
     * @param moduleType the module type
     * @return true if in-app is enabled, false otherwise
     */
    boolean isInAppEnabled(Long userId, ModuleType moduleType);

    /**
     * Creates default preferences for a new user.
     *
     * @param userId the user ID
     */
    void createDefaultPreferences(Long userId);
}
