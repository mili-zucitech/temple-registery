package com.templeregistry.entity.notification;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Per-user in-app notification inbox entry.
 * Append-only. Does NOT extend BaseEntity.
 */
@Entity
@Table(name = "in_app_notifications", indexes = {
        @Index(name = "idx_ian_user_id_read", columnList = "user_id, is_read")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InAppNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "body", nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "priority", length = 20)
    private String priority;  // LOW, MEDIUM, HIGH, CRITICAL

    @Column(name = "category", length = 30)
    private String category;  // SUBMISSION, APPROVAL, REJECTION, etc.

    @Column(name = "action_url", length = 255)
    private String actionUrl;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "reference_type", length = 32)
    private String referenceType;

    @Column(name = "is_read", nullable = false)
    private boolean isRead;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
