package com.templeregistry.entity.notification;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Append-only audit log of all notification dispatch attempts.
 * Does NOT extend BaseEntity — immutable once written.
 */
@Entity
@Table(name = "notification_events", indexes = {
        @Index(name = "idx_ne_recipient_id", columnList = "recipient_id"),
        @Index(name = "idx_ne_event_type", columnList = "event_type")
})
@Getter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recipient_id", nullable = false)
    private Long recipientId;

    @Column(name = "event_type", nullable = false, length = 64)
    private String eventType;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "reference_type", length = 32)
    private String referenceType;

    /** SENT, FAILED, PENDING */
    @Column(name = "channel", nullable = false, length = 16)
    private String channel;

    @Column(name = "status", nullable = false, length = 16)
    private String status;

    @Column(name = "failure_reason", length = 512)
    private String failureReason;

    @CreationTimestamp
    @Column(name = "dispatched_at", nullable = false, updatable = false)
    private LocalDateTime dispatchedAt;
}
