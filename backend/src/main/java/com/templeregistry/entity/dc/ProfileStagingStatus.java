package com.templeregistry.entity.dc;

/**
 * Status values for temple profile staging submissions.
 * dc_e2e Section 4.4 / V13 migration.
 */
public enum ProfileStagingStatus {
    DRAFT,
    PENDING_REVIEW,
    APPROVED,
    REJECTED,
    SUPERSEDED
}
