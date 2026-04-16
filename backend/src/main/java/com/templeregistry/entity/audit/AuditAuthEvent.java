package com.templeregistry.entity.audit;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/** Authentication event log: login, logout, MFA, password reset, lockout. */
@Entity
@Table(name = "audit_auth_events", indexes = {
        @Index(name = "idx_aae_user_id", columnList = "user_id"),
        @Index(name = "idx_aae_event_type", columnList = "event_type")
})
@Getter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditAuthEvent {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "username", length = 128)
    private String username;

    @Column(name = "event_type", nullable = false, length = 64)
    private String eventType;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "outcome", nullable = false, length = 16) // SUCCESS, FAILURE
    private String outcome;

    @Column(name = "detail", length = 512)
    private String detail;

    @CreationTimestamp
    @Column(name = "occurred_at", nullable = false, updatable = false)
    private LocalDateTime occurredAt;
}
