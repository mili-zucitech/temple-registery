package com.templeregistry.dto.response.auditor;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AuditTrailEntry {
    /** "GOVERNANCE_ACTION" or "DATA_EVENT" */
    private String source;
    private String action;
    private String entityType;
    private Long entityId;
    private Long actorUserId;
    private String actorRole;
    private String detail;
    private LocalDateTime timestamp;
}
