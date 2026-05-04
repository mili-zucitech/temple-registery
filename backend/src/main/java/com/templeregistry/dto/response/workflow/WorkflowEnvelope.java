package com.templeregistry.dto.response.workflow;

import com.templeregistry.service.clarification.ClarificationSummary;
import com.templeregistry.service.workflow.AvailableAction;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * Unified API response envelope for all governable entities (API v2).
 *
 * Replaces the divergent response shapes across Trust, Declaration, Temple Profile:
 *   - Trust: submissionStatus + dcDecisionStatus + systemVerificationStatus (3 status fields)
 *   - Declaration: status + physicalVerificationStatus + systemVerificationStatus (3 status fields)
 *   - Temple Profile: status (1 field, but no workflow context)
 *   - BoardMember: isVerifiedByDc (boolean — ambiguous)
 *
 * New contract:
 *   - `data` = pure module domain data (trust fields, declaration figures, etc.)
 *   - `workflow` = everything about governance state (single source of truth)
 *   - `clarification` = clarification thread summary
 *   - `notifications` = unread count + latest message for badge
 *
 * Frontend reads ONLY workflow.status — never touches dcDecisionStatus etc.
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WorkflowEnvelope<T> {

    /** Module-specific domain data (Trust, Declaration, Temple Profile fields). */
    private final T data;

    /** Workflow governance state. */
    private final WorkflowSummary workflow;

    /** Clarification thread summary. */
    private final ClarificationSummary clarification;

    /** Notification badge context. */
    private final NotificationBadge notifications;

    // ─── Nested DTOs ─────────────────────────────────────────────────────────

    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class WorkflowSummary {
        private final Long instanceId;
        private final String entityType;
        private final String status;
        private final String subStatus;
        private final Long version;
        private final String currentActor;
        private final String submittedAt;
        private final String statusUpdatedAt;
        private final String deadlineAt;

        /** Actions the current user can execute on this instance right now. */
        private final List<AvailableAction> availableActions;

        /** Whether this record has unapproved edits pending DC review. */
        private final boolean hasUnapprovedChanges;

        /** Version comparison summary (populated when status = UPDATED_AFTER_APPROVAL). */
        private final VersionSummary versionSummary;

        /** Audit trail summary. */
        private final AuditSummary auditSummary;
    }

    @Getter
    @Builder
    public static class VersionSummary {
        private final int currentVersion;
        private final int previousApprovedVersion;
        private final boolean diffAvailable;
        private final int changedFieldCount;
    }

    @Getter
    @Builder
    public static class AuditSummary {
        private final int totalActions;
        private final String lastAction;
        private final String lastActionAt;
        private final String lastActionBy;
    }

    @Getter
    @Builder
    public static class NotificationBadge {
        private final long unreadCount;
        private final String latestMessage;
    }
}
