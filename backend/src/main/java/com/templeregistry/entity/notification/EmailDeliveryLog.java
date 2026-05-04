package com.templeregistry.entity.notification;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Audit log for email delivery attempts.
 * Tracks all email notifications sent, including success/failure status.
 */
@Entity
@Table(name = "email_delivery_logs", indexes = {
        @Index(name = "idx_edl_notification_event", columnList = "notification_event_id"),
        @Index(name = "idx_edl_recipient_email", columnList = "recipient_email"),
        @Index(name = "idx_edl_status", columnList = "status"),
        @Index(name = "idx_edl_sent_at", columnList = "sent_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailDeliveryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "notification_event_id")
    private Long notificationEventId;

    @Column(name = "recipient_email", nullable = false, length = 255)
    private String recipientEmail;

    @Column(name = "subject", nullable = false, length = 500)
    private String subject;

    @Column(name = "template_name", nullable = false, length = 100)
    private String templateName;

    @Column(name = "status", nullable = false, length = 20)
    private String status;  // SENT, FAILED, BOUNCED

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "failure_reason", length = 1000)
    private String failureReason;

    @Builder.Default
    @Column(name = "retry_count")
    private int retryCount = 0;
}
