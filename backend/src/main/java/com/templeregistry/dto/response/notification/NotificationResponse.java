package com.templeregistry.dto.response.notification;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationResponse {
    private Long id;
    /** Canonical event type, e.g. TEMPLE_PROFILE_APPROVED, TRUST_REJECTED. */
    private String notificationType;
    private String title;
    private String body;
    private String priority;
    private String category;
    private String actionUrl;
    /** Deep-link target — use this for navigation on click. */
    private String redirectUrl;
    private String referenceType;
    private Long referenceId;
    private Long workflowInstanceId;
    /** Owning temple ID — used for DC deep-linking. */
    private Long templeId;
    /** Denormalised temple name — shown in the notification body. */
    private String templeName;
    /** Full name of the user who triggered the event. */
    private String actionByName;
    private String actionByRole;
    /** WorkflowStatus after the transition (APPROVED, REJECTED, …). */
    private String workflowStatus;
    private boolean read;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
}
