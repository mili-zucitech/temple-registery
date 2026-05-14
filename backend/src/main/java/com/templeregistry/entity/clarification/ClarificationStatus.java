package com.templeregistry.entity.clarification;

/**
 * Status of a clarification thread (one round of DC↔TA conversation).
 */
public enum ClarificationStatus {
    /** DC has opened this thread. TA has not responded yet. */
    OPEN,

    /** TA has submitted at least one response. DC has not yet resolved. */
    RESPONDED,

    /** DC has explicitly resolved / accepted the TA response. */
    RESOLVED,

    /** The SLA deadline for this thread has passed without TA responding. */
    EXPIRED,

    /** Escalated to SUPER_ADMIN due to repeated rounds or SLA breach. */
    ESCALATED
}
