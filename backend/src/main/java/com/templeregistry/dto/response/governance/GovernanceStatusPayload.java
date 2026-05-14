package com.templeregistry.dto.response.governance;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.List;

/**
 * Canonical governance status payload — embedded in all governed-module responses.
 *
 * Single source of truth for the frontend.
 * Replaces: TrustResponse.submissionStatus + dcDecisionStatus
 *           DeclarationResponse.status
 *           TempleProfileStagingResponse.statusLabel
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GovernanceStatusPayload {

    /** WorkflowStatus enum name — e.g. "APPROVED", "CLARIFICATION_REQUESTED". */
    private String status;

    /** Module-specific sub-status (nullable). */
    private String subStatus;

    /** Human-readable label for display. */
    private String label;

    /** INFO | WARNING | ERROR | SUCCESS — drives badge colour on frontend. */
    private String severity;

    /** Role that must act next: "TA" | "DC" | "SYSTEM" | null (terminal state). */
    private String actionableBy;

    /** Whether the next action requires a free-text comment/reason. */
    private boolean requiresComment;

    /** When the entity was submitted into the workflow (nullable for DRAFT). */
    private Instant pendingSince;

    /** SLA deadline (nullable). */
    private Instant deadline;

    /** WorkflowInstance PK — for WorkflowGovernancePanel deep-link. */
    private Long workflowInstanceId;

    /**
     * Actions the current {@link #actionableBy} role may perform from this state.
     * Derived from {@link com.templeregistry.service.workflow.TransitionRuleRegistry}.
     * Empty list for terminal states (APPROVED, REJECTED, etc.).
     * Frontend must use this to decide which action buttons to render.
     */
    @Builder.Default
    private List<String> allowedActions = List.of();

    /**
     * Rejection or send-back reason from DC — populated only when status = REJECTED.
     * Sourced from the most recent REJECT WorkflowTransition.comment.
     * Null for all other statuses.
     */
    private String rejectionReason;

    /**
     * Fallback payload for entities that have no WorkflowInstance yet
     * (pre-migration records or corrupt data).
     */
    public static GovernanceStatusPayload unknown(String entityType, Long entityId) {
        return GovernanceStatusPayload.builder()
                .status("UNKNOWN")
                .subStatus(null)
                .label("No governance record — awaiting first submission")
                .severity("INFO")
                .actionableBy(null)
                .requiresComment(false)
                .pendingSince(null)
                .deadline(null)
                .workflowInstanceId(null)
                .allowedActions(List.of())
                .build();
    }
}
