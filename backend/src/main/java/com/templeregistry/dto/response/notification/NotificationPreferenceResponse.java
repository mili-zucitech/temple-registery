package com.templeregistry.dto.response.notification;

import com.templeregistry.event.base.ModuleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferenceResponse {

    private Long id;
    private ModuleType moduleType;
    private boolean inAppEnabled;
    private boolean emailEnabled;
}
