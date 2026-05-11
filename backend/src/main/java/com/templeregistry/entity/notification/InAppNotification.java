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

    /** Canonical event type, e.g. TEMPLE_PROFILE_APPROVED, TRUST_REJECTED. */
    @Column(name = "notification_type", length = 50)
    private String notificationType;

    @Column(name = "action_url", length = 255)
    private String actionUrl;

    /** Deep-link the frontend should navigate to when the user clicks this notification. */
    @Column(name = "redirect_url", length = 512)
    private String redirectUrl;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "reference_type", length = 32)
    private String referenceType;

    /** Owning temple — denormalised for efficient inbox queries without a JOIN. */
    @Column(name = "temple_id")
    private Long templeId;

    @Column(name = "temple_name", length = 255)
    private String templeName;

    /** Full name of the user who triggered the workflow event. */
    @Column(name = "action_by_name", length = 255)
    private String actionByName;

    @Column(name = "action_by_role", length = 50)
    private String actionByRole;

    /** WorkflowStatus after the transition, e.g. APPROVED, REJECTED. */
    @Column(name = "workflow_status", length = 50)
    private String workflowStatus;

    @Column(name = "is_read", nullable = false)
    private boolean isRead;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "requires_acknowledgement", nullable = false)
    @Builder.Default
    private boolean requiresAcknowledgement = false;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Column(name = "acknowledged_by")
    private Long acknowledgedBy;

    /** Soft-delete timestamp. NULL = visible; non-NULL = hidden from inbox. */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "idempotency_key", length = 255, unique = true)
    private String idempotencyKey;

    /**
     * Links this notification to a WorkflowInstance.
     * Used by the frontend to deep-link from the bell icon to the WorkflowGovernancePanel.
     * Populated by createInAppNotification() in NotificationServiceImpl.
     */
    @Column(name = "workflow_instance_id")
    private Long workflowInstanceId;
}
