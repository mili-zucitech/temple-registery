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
    SUPERSEDED,
    /** TA has withdrawn the submission before DC acted. Terminal state. */
    WITHDRAWN;

    /**
     * Resolves a status string, supporting legacy aliases.
     * "CLARIFICATION_REQUESTED" resolves to CLARIFICATION_REQUIRED.
     */
    public static DeclarationStatus fromValue(String value) {
        if (value == null) return null;
        String upper = value.toUpperCase();
        if ("CLARIFICATION_REQUESTED".equals(upper)) {
            return CLARIFICATION_REQUIRED;
        }
        return DeclarationStatus.valueOf(upper);
    }
}
