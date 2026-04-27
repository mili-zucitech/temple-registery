package com.templeregistry.dto.request.notification;

import com.templeregistry.event.base.ModuleType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePreferencesRequest {

    @NotEmpty(message = "Preferences list cannot be empty")
    @Valid
    private List<PreferenceItem> preferences;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PreferenceItem {

        @NotNull(message = "Module type is required")
        private ModuleType moduleType;

        private boolean inAppEnabled;

        private boolean emailEnabled;
    }
}
