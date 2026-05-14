package com.templeregistry.entity.clarification;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * A single message within a clarification thread.
 * Direction indicates whether the message is from DC (asking) or TA (responding).
 *
 * Supports:
 *   - Optional section targeting (which section of the form does this concern?)
 *   - Optional field targeting (which specific fields? stored as JSON array)
 *   - Attachments (TA may upload supporting documents)
 */
@Entity
@Table(
    name = "clarification_messages",
    indexes = {
        @Index(name = "idx_cm_thread_id", columnList = "thread_id"),
        @Index(name = "idx_cm_author_id", columnList = "author_id"),
        @Index(name = "idx_cm_created_at", columnList = "created_at_instant")
    }
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class ClarificationMessage extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thread_id", nullable = false, updatable = false)
    private ClarificationThread thread;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", nullable = false, length = 15, updatable = false)
    private ClarificationMessageDirection direction;

    /** User who authored this message. */
    @Column(name = "author_id", nullable = false, updatable = false)
    private Long authorId;

    @Column(name = "message", columnDefinition = "TEXT", nullable = false, updatable = false)
    private String message;

    /**
     * Optional: which section of the form does this message concern?
     * E.g., "Trust Details", "Board Members", "Agricultural Land"
     * Null = message applies to entire submission.
     */
    @Column(name = "section_name", length = 100, updatable = false)
    private String sectionName;

    /**
     * Optional: JSON array of specific field names this message targets.
     * E.g., ["trustName", "registrationNumber"]
     * Null = no specific field targeting.
     */
    @Column(name = "field_names_json", columnDefinition = "JSON", updatable = false)
    private String fieldNamesJson;

    @Column(name = "created_at_instant", nullable = false, updatable = false)
    private Instant createdAtInstant;

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ClarificationAttachment> attachments = new ArrayList<>();
}
