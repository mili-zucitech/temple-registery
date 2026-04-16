package com.templeregistry.entity.declaration;

public enum DeclarationStatus {
    DRAFT,
    /** Submitted by Temple Authority and awaiting DC review. Previously named SUBMITTED. */
    PENDING_REVIEW,
    UNDER_REVIEW,
    RESUBMITTED,
    CLARIFICATION_REQUESTED,
    PHYSICAL_VERIFICATION_REQUESTED,
    APPROVED,
    REJECTED,
    OVERDUE,
    /** Older version superseded when a newer version for the same temple+year reaches APPROVED. */
    SUPERSEDED
}
