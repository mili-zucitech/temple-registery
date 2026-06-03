package com.templeregistry.entity.notification;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDateTime;

/**
 * DB-backed email outbox — replaces the volatile in-memory {@code LinkedBlockingQueue}.
 *
 * <p>Every email that needs to be delivered is persisted here <em>before</em> SMTP
 * delivery is attempted.  The outbox worker ({@code EmailDeliveryService.processQueue()})
 * reads {@code PENDING} rows, renders and sends them via SMTP, then marks them {@code SENT}.
 * On failure the row is retried with exponential back-off up to {@code max_retries} times;
 * beyond that the row is moved to {@code DEAD_LETTER} and logged as a permanent failure.
 *
 * <p>The full template render context (all Thymeleaf variables) is stored in
 * {@code context_json} so retries render an identical email to the original attempt —
 * avoiding the partial-context problem of the previous {@code resendByLog()} approach.
 *
 * <p>This entity does NOT extend {@code BaseEntity} intentionally:
 * <ul>
 *   <li>It is an append-mostly operational log, not a domain entity.</li>
 *   <li>Soft-delete via {@code is_deleted} is unnecessary — status transitions are sufficient.</li>
 *   <li>The {@code @SQLRestriction} on BaseEntity would interfere with outbox queries.</li>
 * </ul>
 */
@Entity
@Table(
    name = "email_outbox",
    indexes = {
        @Index(name = "idx_eo_status_priority_retry",   columnList = "status, priority, next_retry_at"),
        @Index(name = "idx_eo_recipient_email",          columnList = "recipient_email"),
        @Index(name = "idx_eo_entity",                   columnList = "entity_type, entity_id"),
        @Index(name = "idx_eo_created_at",               columnList = "created_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailOutbox {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** FK to {@code users.id}; null for non-user emails (e.g. password-reset to external address). */
    @Column(name = "recipient_user_id")
    private Long recipientUserId;

    /** Recipient email resolved at enqueue time — never null. */
    @Column(name = "recipient_email", nullable = false, length = 255)
    private String recipientEmail;

    @Column(name = "subject", nullable = false, length = 500)
    private String subject;

    /**
     * Short template key as stored in {@code notification_rules.template_key}
     * (e.g. {@code "submission-notification"}).
     * {@link com.templeregistry.service.notification.EmailTemplateResolver} adds the {@code "email/"} prefix
     * at render time.
     */
    @Column(name = "template_key", nullable = false, length = 100)
    private String templateKey;

    /**
     * Full Thymeleaf render context serialised as JSON ({@code Map<String, Object>}).
     * Stored at enqueue time so retries render the <em>identical</em> email.
     */
    @Column(name = "context_json", columnDefinition = "JSON", nullable = false)
    private String contextJson;

    @Column(name = "entity_type", length = 40)
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    /**
     * Delivery status.
     * <ul>
     *   <li>{@code PENDING}     — awaiting first delivery attempt</li>
     *   <li>{@code SENT}        — successfully delivered via SMTP</li>
     *   <li>{@code FAILED}      — last attempt failed; will be retried</li>
     *   <li>{@code DEAD_LETTER} — max retries exhausted; requires manual intervention</li>
     * </ul>
     */
    @Builder.Default
    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING";

    /** LOW | MEDIUM | HIGH | CRITICAL */
    @Builder.Default
    @Column(name = "priority", nullable = false, length = 10)
    private String priority = "MEDIUM";

    @Builder.Default
    @Column(name = "retry_count", nullable = false)
    private int retryCount = 0;

    @Builder.Default
    @Column(name = "max_retries", nullable = false)
    private int maxRetries = 5;

    /** When the next retry should be attempted (exponential back-off). Null = process immediately. */
    @Column(name = "next_retry_at")
    private Instant nextRetryAt;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "last_failure_reason", columnDefinition = "TEXT")
    private String lastFailureReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
