package com.templeregistry.service.audit;

/**
 * Typed audit action types for declaration workflow events.
 */
public enum AuditActionType {
    SUBMIT,
    UNDER_REVIEW,
    CLARIFICATION_REQUESTED,
    CLARIFICATION_RESPONDED,
    SITE_VISIT_SCHEDULED,
    SITE_VISIT_COMPLETED,
    VERIFIED,
    APPROVED,
    REJECTED
}
