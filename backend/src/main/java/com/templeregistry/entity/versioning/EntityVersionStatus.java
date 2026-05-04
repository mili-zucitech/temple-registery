package com.templeregistry.entity.versioning;

/**
 * Status of an entity version snapshot.
 */
public enum EntityVersionStatus {
    /** Currently the working draft being reviewed. */
    DRAFT_OVERLAY,

    /** DC has approved this version. */
    APPROVED,

    /** This version was approved but has since been superseded by a newer approval. */
    SUPERSEDED,

    /** TA or DC discarded this draft overlay. The previous approved version is restored. */
    DISCARDED
}
