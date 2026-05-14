package com.templeregistry.dto.response.dc;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * A single entry in the DC-side temple profile version history.
 * One entry per staging submission (versionNumber uniquely identifies it).
 */
@Getter
@Builder
public class DcProfileHistoryEntry {

    private Long stagingId;
    private int versionNumber;

    /** Canonical workflow status (APPROVED, REJECTED, SUBMITTED, RESUBMITTED, etc.). */
    private String status;

    private LocalDateTime submittedAt;
    private Long submittedBy;

    private LocalDateTime reviewedAt;
    private Long reviewedBy;

    /** DC rejection/approval remarks for this version. */
    private String reviewComment;
}
