package com.templeregistry.service.notification.impl;

import lombok.Builder;
import lombok.Getter;
import java.util.Map;

/** Email delivery request queued by NotificationDispatchService. */
@Getter
@Builder
public class EmailRequest {
    private final Long recipientId;
    private final String templateKey;
    private final String entityType;
    private final Long entityId;
    private final String subject;
    private final Map<String, Object> metadata;
}
