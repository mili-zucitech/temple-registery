package com.templeregistry.entity.timeline;

/**
 * Fine-grained event code used by the frontend to look up labels, icons, and colours.
 *
 * Convention: MODULE_ACTION — e.g. PROFILE_APPROVED, DECLARATION_SUBMITTED.
 *
 * Frontend maps these codes to:
 *  - display title
 *  - icon
 *  - badge colour
 *
 * DO NOT add display strings here — those live in the frontend mapper.
 */
public enum TimelineEventCode {

    // ─── Temple Profile ───────────────────────────────────────────────────────
    PROFILE_CREATED,
    PROFILE_SUBMITTED,
    PROFILE_APPROVED,
    PROFILE_REJECTED,
    PROFILE_RESUBMITTED,
    PROFILE_UPDATED,
    PROFILE_UNDER_REVIEW,
    PROFILE_CLARIFICATION_REQUESTED,
    PROFILE_CLARIFICATION_RESPONDED,
    PROFILE_WITHDRAWN,

    // ─── Declaration ─────────────────────────────────────────────────────────
    DECLARATION_SUBMITTED,
    DECLARATION_APPROVED,
    DECLARATION_REJECTED,
    DECLARATION_RESUBMITTED,
    DECLARATION_UNDER_REVIEW,
    DECLARATION_CLARIFICATION_REQUESTED,
    DECLARATION_CLARIFICATION_RESPONDED,
    DECLARATION_SITE_VISIT_SCHEDULED,
    DECLARATION_SITE_VISIT_COMPLETED,
    DECLARATION_WITHDRAWN,
    DECLARATION_SUPERSEDED,

    // ─── Trust & Board ────────────────────────────────────────────────────────
    TRUST_SUBMITTED,
    TRUST_APPROVED,
    TRUST_REJECTED,
    TRUST_RESUBMITTED,
    TRUST_UNDER_REVIEW,
    TRUST_CLARIFICATION_REQUESTED,
    TRUST_CLARIFICATION_RESPONDED,

    // ─── Board Member ─────────────────────────────────────────────────────────
    BOARD_MEMBER_SUBMITTED,
    BOARD_MEMBER_APPROVED,
    BOARD_MEMBER_REJECTED,

    // ─── Staff / Employee ─────────────────────────────────────────────────────
    STAFF_SUBMITTED,
    STAFF_APPROVED,
    STAFF_REJECTED,

    // ─── Contractor ───────────────────────────────────────────────────────────
    CONTRACTOR_SUBMITTED,
    CONTRACTOR_APPROVED,
    CONTRACTOR_REJECTED,

    // ─── Documents ────────────────────────────────────────────────────────────
    DOCUMENT_UPLOADED,
    DOCUMENT_DELETED,

    // ─── System ───────────────────────────────────────────────────────────────
    SYSTEM_INITIATED,
    SYSTEM_AUTO_SUPERSEDED,
    SYSTEM_ESCALATED,
    SYSTEM_OVERDUE_FLAGGED,

    /** Fallback when no specific code matches — should not appear in production data. */
    GENERIC_EVENT
}
