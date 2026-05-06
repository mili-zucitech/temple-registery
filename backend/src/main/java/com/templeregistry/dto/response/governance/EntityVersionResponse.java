package com.templeregistry.dto.response.governance;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class EntityVersionResponse {
    private Long id;
    private String entityType;
    private Long entityId;
    private Long workflowInstanceId;
    private int versionNumber;
    private String status;
    private String snapshotJson;
    private String diffJson;
    private Long createdByUserId;
    private Long approvedByUserId;
    private LocalDateTime createdAt;
}
