package com.templeregistry.entity.dc;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Database-backed idempotency cache for workflow mutation endpoints.
 *
 * On first request: INSERT with actor_user_id + idempotency_key + response.
 * On duplicate (same actor + key within TTL): return stored response_body.
 * Expires after 5 minutes; a cleanup job deletes rows WHERE expires_at < NOW().
 *
 * The unique constraint on (actor_user_id, idempotency_key) prevents concurrent
 * duplicate-key conflicts from being silently swallowed — the application layer
 * must handle DataIntegrityViolationException as a cache hit.
 *
 * dc_e2e Section 4.12b / V15 migration: idempotency_records.
 */
@Entity(name = "DcIdempotencyRecord")
@Table(
        name = "idempotency_records",
        indexes = {
                @Index(name = "idx_idempotency_lookup",  columnList = "actor_user_id, idempotency_key"),
                @Index(name = "idx_idempotency_expiry",  columnList = "expires_at")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_idempotency_actor_key", columnNames = {"actor_user_id", "idempotency_key"})
        }
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class IdempotencyRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_user_id", nullable = false)
    private Long actorUserId;

    @Column(name = "idempotency_key", nullable = false, length = 255)
    private String idempotencyKey;

    /** Serialized JSON of the first successful response body. */
    @Column(name = "response_body", nullable = false, columnDefinition = "MEDIUMTEXT")
    private String responseBody;

    /** HTTP status code of the first response (e.g. 200, 201). */
    @Column(name = "response_status", nullable = false)
    private int responseStatus;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** created_at + 5 minutes, set at INSERT time by the application layer. */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.expiresAt == null) {
            this.expiresAt = this.createdAt.plusMinutes(5);
        }
    }
}
