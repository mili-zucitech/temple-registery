package com.templeregistry.dto.response.ta;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Aggregated dashboard summary for the Temple Authority landing page.
 * Provides the temple identity, profile workflow status, and actionable items.
 */
@Getter
@Builder
public class TaDashboardResponse {

    private TempleBasicInfo temple;
    private String profileStatus;
    private LocalDateTime lastUpdated;
    private List<String> pendingActions;

    /**
     * Subset of Temple master fields needed for the dashboard header.
     * TA cannot modify these; they are managed by Super Admin.
     */
    @Getter
    @Builder
    public static class TempleBasicInfo {
        private Long id;
        private String name;
        private String registrationNumber;
        private String grade;
        private String status;
    }
}
