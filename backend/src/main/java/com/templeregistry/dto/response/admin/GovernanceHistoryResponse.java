package com.templeregistry.dto.response.admin;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class GovernanceHistoryResponse {
    private Long id;
    private Long entityId;
    private String entityType;
    private Long workflowInstanceId;
    private Long workflowTransitionId;
    private Long actorUserId;
    private String actorName;
    private String actorRole;
    private String action;
    private String comment;
    private LocalDateTime timestamp;
}
