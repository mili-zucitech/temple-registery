package com.templeregistry.entity.temple;

/**
 * Status of a TempleProfileStaging record.
 * Maps to the DB column value. PENDING_REVIEW is displayed as SUBMITTED in API responses
 * per DECISION-01 in the TA workflow specification.
 */
public enum TempleProfileStagingStatus {
    DRAFT,
    PENDING_REVIEW,   // displayed as SUBMITTED to the TA/frontend
    APPROVED,
    REJECTED,
    SUPERSEDED
}
