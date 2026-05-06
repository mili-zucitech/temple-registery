package com.templeregistry.dto.response.auditor;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ComplianceAnomalyResponse {
    private Long templeId;
    private String templeName;
    private String districtName;
    private String anomalyType;
    /** Human-readable description of why this is flagged. */
    private String description;
    private LocalDateTime detectedAt;
}
