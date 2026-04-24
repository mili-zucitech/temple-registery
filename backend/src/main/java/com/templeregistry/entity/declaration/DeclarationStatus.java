package com.templeregistry.entity.declaration;

/**
 * Canonical 12-value declaration status enum.
 *
 * Migration mapping from old values:
 *   PENDING_REVIEW                → SUBMITTED
 *   RESUBMITTED                   → SUBMITTED
 *   CLARIFICATION_REQUESTED       → CLARIFICATION_REQUIRED
 *   PHYSICAL_VERIFICATION_REQUESTED → SITE_VISIT_SCHEDULED
 */
public enum DeclarationStatus {
    DRAFT,
    /** Submitted by Temple Authority and awaiting DC review. */
    SUBMITTED,
    UNDER_REVIEW,
    CLARIFICATION_REQUIRED,
    CLARIFICATION_RESPONDED,
    SITE_VISIT_SCHEDULED,
    SITE_VISIT_COMPLETED,
    VERIFIED,
    APPROVED,
    REJECTED,
    OVERDUE,
    /** Older version superseded when a newer version for the same temple+year reaches APPROVED. */
    SUPERSEDED
}
