package com.templeregistry.entity.workflow;

/**
 * Canonical workflow status — single source of truth for ALL governable entities.
 *
 * Replaces:
 *   - DeclarationStatus (partial mapping)
 *   - SubmissionStatus (Trust)
 *   - DcDecisionStatus (Trust — REMOVED)
 *   - TempleProfileStagingStatus (partial mapping)
 *   - isVerifiedByDc boolean (BoardMember — REMOVED)
 *
 * All 13 states are shared across Temple Profile, Declaration, Trust, Board Member.
 * Module-specific nuances are handled via WorkflowInstance.subStatus.
 */
public enum WorkflowStatus {

    /**
     * Entity created by TA but not yet submitted.
     * TA can edit freely. DC cannot see.
     */
    DRAFT,

    /**
     * TA submitted for DC review.
     * DC receives notification. TA cannot edit.
     */
    SUBMITTED,

    /**
     * DC has opened the record and is actively reviewing.
     * Intermediate state between SUBMITTED and a decision.
     */
    UNDER_REVIEW,

    /**
     * DC has requested clarification from the TA.
     * TA must respond before review can continue.
     * ClarificationThread created and linked.
     */
    CLARIFICATION_REQUESTED,

    /**
     * TA has responded to the clarification request.
     * DC notified. Ready for DC to continue review.
     */
    CLARIFICATION_RESPONDED,

    /**
     * TA has resubmitted after a rejection or after editing an approved record.
     */
    RESUBMITTED,

    /**
     * DC has approved the submission.
     * For Temple Profile: data promoted to live Temple record.
     * For Declaration: acknowledgement number generated.
     * For Trust: trust becomes active.
     */
    APPROVED,

    /**
     * DC has re-approved after a version update (edit-after-approval flow).
     * Functionally equivalent to APPROVED but distinguishes the version round.
     */
    RE_APPROVED,

    /**
     * DC has rejected the submission. Terminal for this version.
     * TA must create a new submission from scratch (new version).
     */
    REJECTED,

    /**
     * TA has edited a previously APPROVED/RE_APPROVED record.
     * Previous approved data is snapshotted. New data awaits re-review.
     * TA must explicitly RESUBMIT to progress.
     */
    UPDATED_AFTER_APPROVAL,

    /**
     * This workflow version has been superseded by a newer approved version.
     * Immutable. Historical only.
     */
    SUPERSEDED,

    /**
     * The submission SLA deadline has passed without DC action.
     * Sub-state of SUBMITTED/UNDER_REVIEW rather than top-level in most cases.
     * Kept as top-level for overdue queue dashboards.
     */
    OVERDUE,

    /**
     * TA has withdrawn the submission before DC acted.
     * Terminal state.
     */
    WITHDRAWN
}
