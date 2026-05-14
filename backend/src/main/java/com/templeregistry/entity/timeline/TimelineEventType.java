package com.templeregistry.entity.timeline;

/**
 * Broad category of a timeline event.
 */
public enum TimelineEventType {
    /** Workflow state transition (submit, approve, reject, resubmit, clarify, etc.) */
    WORKFLOW_TRANSITION,

    /** A document was uploaded to the temple or one of its sub-entities. */
    DOCUMENT_UPLOAD,

    /** A document was soft-deleted. */
    DOCUMENT_DELETE,

    /** System-generated event (scheduler, auto-supersede, escalation, etc.) */
    SYSTEM_EVENT
}
