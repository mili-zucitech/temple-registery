package com.templeregistry.entity.employee;

/**
 * Submission workflow status for employee records.
 * Tracks the approval lifecycle from Temple Authority to District Collector.
 */
public enum SubmissionStatus {
    /** Draft - not yet submitted for review */
    DRAFT,
    
    /** Submitted and awaiting DC review */
    PENDING_REVIEW,
    
    /** Approved by DC */
    APPROVED,
    
    /** Rejected by DC with remarks */
    REJECTED
}
