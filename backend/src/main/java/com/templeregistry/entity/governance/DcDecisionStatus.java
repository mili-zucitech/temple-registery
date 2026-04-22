package com.templeregistry.entity.governance;

/**
 * Layer 3 of the 3-layer governance status model.
 *
 * Represents the DC's decision outcome.
 * Visible to ALL roles (Temple Authority, DC, DC Staff).
 */
public enum DcDecisionStatus {
    PENDING_DC_APPROVAL,
    APPROVED_BY_DC,
    REJECTED_BY_DC
}
