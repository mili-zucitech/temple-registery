package com.templeregistry.dto.response.observation;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ObservationResponse {
    private Long id;
    private Long templeId;
    private String templeName;
    private String entityType;
    private Long entityId;
    private String title;
    private String description;
    private String severity;
    private String status;
    private Long raisedByUserId;
    private Long assignedToUserId;
    private String evidenceDocumentIds;
    private String resolutionNote;
    private LocalDateTime closedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
