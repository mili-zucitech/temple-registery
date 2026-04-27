package com.templeregistry.service.impl.notification;

import com.templeregistry.dto.request.notification.UpdatePreferencesRequest;
import com.templeregistry.dto.response.notification.NotificationPreferenceResponse;
import com.templeregistry.entity.notification.NotificationPreference;
import com.templeregistry.event.base.ModuleType;
import com.templeregistry.repository.notification.NotificationPreferenceRepository;
import com.templeregistry.service.notification.NotificationPreferenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of {@link NotificationPreferenceService}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationPreferenceServiceImpl implements NotificationPreferenceService {

    private final NotificationPreferenceRepository preferenceRepository;

    @Override
    @Transactional(readOnly = true)
    public List<NotificationPreferenceResponse> getUserPreferences(Long userId) {
        List<NotificationPreference> preferences = preferenceRepository.findAllByUserId(userId);

        // If no preferences exist, create defaults
        if (preferences.isEmpty()) {
            createDefaultPreferences(userId);
            preferences = preferenceRepository.findAllByUserId(userId);
        }

        return preferences.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<NotificationPreferenceResponse> updatePreferences(Long userId, UpdatePreferencesRequest request) {
        request.getPreferences().forEach(pref -> {
            NotificationPreference preference = preferenceRepository
                    .findByUserIdAndModuleType(userId, pref.getModuleType())
                    .orElseGet(() -> {
                        NotificationPreference newPref = new NotificationPreference();
                        newPref.setUserId(userId);
                        newPref.setModuleType(pref.getModuleType());
                        newPref.setCreatedAt(LocalDateTime.now());
                        newPref.setUpdatedAt(LocalDateTime.now());
                        newPref.setCreatedBy(userId);
                        newPref.setUpdatedBy(userId);
                        return newPref;
                    });

            preference.setInAppEnabled(pref.isInAppEnabled());
            preference.setEmailEnabled(pref.isEmailEnabled());
            preference.setUpdatedAt(LocalDateTime.now());
            preference.setUpdatedBy(userId);

            preferenceRepository.save(preference);
        });

        return getUserPreferences(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isEmailEnabled(Long userId, ModuleType moduleType) {
        return preferenceRepository.findByUserIdAndModuleType(userId, moduleType)
                .map(NotificationPreference::isEmailEnabled)
                .orElse(true);  // Default to enabled if no preference exists
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isInAppEnabled(Long userId, ModuleType moduleType) {
        return preferenceRepository.findByUserIdAndModuleType(userId, moduleType)
                .map(NotificationPreference::isInAppEnabled)
                .orElse(true);  // Default to enabled if no preference exists
    }

    @Override
    @Transactional
    public void createDefaultPreferences(Long userId) {
        Arrays.stream(ModuleType.values()).forEach(moduleType -> {
            if (!preferenceRepository.existsByUserIdAndModuleType(userId, moduleType)) {
                NotificationPreference preference = NotificationPreference.builder()
                        .userId(userId)
                        .moduleType(moduleType)
                        .inAppEnabled(true)
                        .emailEnabled(true)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .createdBy(userId)
                        .updatedBy(userId)
                        .build();

                preferenceRepository.save(preference);
            }
        });

        log.info("Created default notification preferences for user: {}", userId);
    }

    private NotificationPreferenceResponse toResponse(NotificationPreference pref) {
        return NotificationPreferenceResponse.builder()
                .id(pref.getId())
                .moduleType(pref.getModuleType())
                .inAppEnabled(pref.isInAppEnabled())
                .emailEnabled(pref.isEmailEnabled())
                .build();
    }
}
