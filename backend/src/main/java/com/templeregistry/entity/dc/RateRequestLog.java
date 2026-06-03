package com.templeregistry.entity.dc;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Per-user sliding-window rate limit tracker.
 * Replaces Redis/Bucket4j. Window boundaries are truncated to 10-minute blocks.
 *
 * UPSERT pattern (via Spring Data native query):
 *   INSERT ... ON DUPLICATE KEY UPDATE request_count = request_count + 1, last_request_at = NOW(6)
 *
 * The unique constraint on (user_id, endpoint_key, window_start) ensures each
 * 10-minute window has exactly one counter row per user per endpoint.
 *
 * dc_e2e Section 4.12c / V15 migration: rate_request_log.
 */
@Entity
@Table(
        name = "rate_request_log",
        indexes = {
                @Index(name = "idx_rrl_lookup", columnList = "user_id, endpoint_key, window_start")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_rrl_user_endpoint_window",
                        columnNames = {"user_id", "endpoint_key", "window_start"})
        }
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class RateRequestLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Identifies the rate-limited resource (e.g. "export", "doc_download"). */
    @Column(name = "endpoint_key", nullable = false, length = 100)
    private String endpointKey;

    /** Start of the 10-minute window (truncated by service layer to even 10-min boundary). */
    @Column(name = "window_start", nullable = false)
    private LocalDateTime windowStart;

    @Builder.Default
    @Column(name = "request_count", nullable = false)
    private int requestCount = 1;

    @Column(name = "last_request_at", nullable = false)
    private LocalDateTime lastRequestAt;

    @PrePersist
    protected void onCreate() {
        if (this.lastRequestAt == null) {
            this.lastRequestAt = LocalDateTime.now();
        }
    }
}
