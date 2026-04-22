package com.templeregistry.entity.governance;

/**
 * Layer 1 of the 3-layer governance status model.
 *
 * Visible to ALL roles (Temple Authority, DC, DC Staff).
 * Drives the Temple Authority workflow.
 *
 * Transitions:
 *   DRAFT       → SUBMITTED   (TA submits)
 *   SUBMITTED   → SENT_BACK   (DC sends back with mandatory free-text reason)
 *   SUBMITTED   → APPROVED    (DC approves)
 *   SUBMITTED   → REJECTED    (DC rejects — terminal, TA must create new)
 *   SENT_BACK   → SUBMITTED   (TA edits and re-submits)
 *   REJECTED    → (no edit allowed — TA must create a new record from DRAFT)
 */
public enum SubmissionStatus {
    DRAFT,
    SUBMITTED,
    SENT_BACK,
    APPROVED,
    REJECTED
}
