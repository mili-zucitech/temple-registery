package com.templeregistry.entity.notification;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

/**
 * Declarative notification routing rule.
 *
 * Replaces the NotificationHelper god class (888 lines, 20+ hardcoded methods).
 *
 * Each row defines: "when event X happens for entity type Y via action Z,
 * send notification to recipient type R on channel C using template T."
 *
 * Rules are loaded once at startup and cached. Changes require restart or
 * a cache invalidation endpoint.
 *
 * Use entity_type = '*' for rules that apply to all modules.
 */
@Entity
@Table(
    name = "notification_rules",
    indexes = {
        @Index(name = "idx_nr_event_action", columnList = "event_type, action"),
        @Index(name = "idx_nr_entity_type", columnList = "entity_type"),
        @Index(name = "idx_nr_enabled", columnList = "enabled")
    }
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRule extends BaseEntity {

    /** WORKFLOW_TRANSITION, CLARIFICATION, TASK, SYSTEM */
    @Column(name = "event_type", length = 40, nullable = false)
    private String eventType;

    /** TEMPLE_PROFILE, DECLARATION, TRUST, BOARD_MEMBER, or '*' for all. */
    @Column(name = "entity_type", length = 40, nullable = false)
    private String entityType;

    /** The action that triggers this rule (SUBMIT, APPROVE, REJECT, etc.) */
    @Column(name = "action", length = 40, nullable = false)
    private String action;

    /** TA (temple authority), DC (district collector), ADMIN (super admin). */
    @Column(name = "recipient_type", length = 20, nullable = false)
    private String recipientType;

    /** IN_APP, EMAIL, BOTH. */
    @Column(name = "channel", length = 20, nullable = false)
    private String channel;

    /** LOW, MEDIUM, HIGH, CRITICAL. */
    @Column(name = "priority", length = 10, nullable = false)
    private String priority;

    /**
     * Key to look up the email / in-app notification template.
     * E.g., "submission-notification", "approval-notification".
     */
    @Column(name = "template_key", length = 100, nullable = false)
    private String templateKey;

    @Builder.Default
    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;

    /**
     * Optional human-readable description of what this rule does.
     * For documentation purposes only — not used in processing.
     */
    @Column(name = "description", length = 500)
    private String description;
}
