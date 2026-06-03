package com.templeregistry.entity.workflow;

/**
 * Canonical workflow action enum — all actions that can trigger a state transition.
 *
 * Every state change in the system MUST be represented by exactly one of these actions.
 * No direct entity.setStatus() calls are allowed outside the WorkflowEngine.
 */
public enum WorkflowAction {

    // ─── Temple Authority (TA) Actions ────────────────────────────────────────

    /** TA submits a draft entity for DC review. DRAFT → SUBMITTED. */
    SUBMIT,

    /** TA resubmits after editing an approved record. UPDATED_AFTER_APPROVAL → RESUBMITTED. */
    RESUBMIT,

    /** TA responds to a DC clarification request. CLARIFICATION_REQUESTED → CLARIFICATION_RESPONDED. */
    RESPOND_CLARIFICATION,

    /** TA withdraws a submitted entity before DC acts. SUBMITTED → WITHDRAWN. */
    WITHDRAW,

    /** TA edits an approved record, creating a new draft overlay. APPROVED/RE_APPROVED → UPDATED_AFTER_APPROVAL. */
    EDIT_APPROVED,

    // ─── District Collector (DC) Actions ──────────────────────────────────────

    /** DC begins active review. SUBMITTED/RESUBMITTED → UNDER_REVIEW. */
    BEGIN_REVIEW,

    /** DC approves the submission. SUBMITTED/UNDER_REVIEW/CLARIFICATION_RESPONDED → APPROVED. */
    APPROVE,

    /** DC re-approves after a version update. RESUBMITTED → RE_APPROVED. */
    RE_APPROVE,

    /** DC rejects the submission (terminal). SUBMITTED/UNDER_REVIEW/CLARIFICATION_RESPONDED → REJECTED. */
    REJECT,

    /**
     * DC rejects an edit of a previously approved entity (non-terminal).
     * Restores approved data snapshot. RESUBMITTED → RE_APPROVED.
     * Used instead of REJECT when the entity was previously approved (approvedData != null).
     */
    REJECT_EDIT,

    /**
     * DC requests clarification from TA.
     * SUBMITTED/UNDER_REVIEW/CLARIFICATION_RESPONDED → CLARIFICATION_REQUESTED.
     * A ClarificationThread must be created before this action.
     */
    REQUEST_CLARIFICATION,

    /**
     * DC sends back the record for TA to correct (legacy compat alias for REQUEST_CLARIFICATION).
     * Prefer REQUEST_CLARIFICATION for new code.
     * @deprecated Use REQUEST_CLARIFICATION + ClarificationEngine instead.
     */
    @Deprecated
    SEND_BACK,

    // ─── Task Actions (Site Visit — Extension Hook, not implemented yet) ──────

    /** DC schedules a site visit task. Sets sub-status SITE_VISIT_SCHEDULED. */
    SCHEDULE_SITE_VISIT,

    /** Inspector/assignee completes site visit. Sets sub-status SITE_VISIT_COMPLETED. */
    COMPLETE_SITE_VISIT,

    /** DC verifies site visit findings as passed. Sets sub-status PHYSICALLY_VERIFIED. */
    VERIFY_SITE_VISIT,

    /** DC marks site visit as failed. Sets sub-status VERIFICATION_FAILED. */
    FAIL_SITE_VISIT,

    /**
     * DC verifies a temple profile after reviewing the submission.
     * SUBMITTED/UNDER_REVIEW → APPROVED.
     */
    VERIFY_TEMPLE_PROFILE,

    /**
     * DC flags a temple profile for issues (non-terminal — TA must resolve).
     * SUBMITTED/UNDER_REVIEW/APPROVED → CLARIFICATION_REQUESTED (subStatus: FLAGGED).
     */
    FLAG_TEMPLE_PROFILE,

    /**
     * DC removes a flag from a temple profile.
     * CLARIFICATION_REQUESTED → SUBMITTED.
     */
    UNFLAG_TEMPLE_PROFILE,

    // ─── System Actions ────────────────────────────────────────────────────────

    /** Scheduler flags overdue submissions. SUBMITTED/UNDER_REVIEW → FLAG_OVERDUE sub-status. */
    FLAG_OVERDUE,

    /** Scheduler warns DC that a deadline is approaching (within 48h). */
    WARN_DEADLINE_APPROACHING,

    /** System escalates to super admin on repeated clarification rounds. */
    ESCALATE,

    /** System marks previous approved version as SUPERSEDED when new version is approved. */
    AUTO_SUPERSEDE,

    /** System expires a deadline-based workflow. */
    EXPIRE_DEADLINE,

    /**
     * System-internal action: workflow instance created for a new entity.
     * NULL → DRAFT. Recorded in workflow_transitions for audit completeness.
     * Never exposed to users or used in transition rules.
     */
    SYSTEM_INITIATE
}
