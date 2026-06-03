package com.templeregistry.dto.response.accesscontrol;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PolicyAuditLogResponse {

    private Long id;
    private Long policyId;
    private Long fieldMaskId;
    private Long changedByUserId;
    private String changeType;
    private String oldValue;
    private String newValue;
    private LocalDateTime changedAt;
    private String ipAddress;
}
