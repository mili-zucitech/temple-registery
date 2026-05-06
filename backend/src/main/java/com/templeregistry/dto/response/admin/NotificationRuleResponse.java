package com.templeregistry.dto.response.admin;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NotificationRuleResponse {
    private Long id;
    private String eventType;
    private String entityType;
    private String action;
    private String recipientType;
    private String channel;
    private String priority;
    private String templateKey;
    private boolean enabled;
    private String description;
}
