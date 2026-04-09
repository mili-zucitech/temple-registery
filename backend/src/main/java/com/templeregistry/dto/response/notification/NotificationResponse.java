package com.templeregistry.dto.response.notification;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationResponse {
    private Long id;
    private String title;
    private String body;
    private String referenceType;
    private Long referenceId;
    private boolean read;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
}
