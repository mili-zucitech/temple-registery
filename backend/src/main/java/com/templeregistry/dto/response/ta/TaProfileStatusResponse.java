package com.templeregistry.dto.response.ta;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Lightweight profile workflow status for the TA status-check endpoint.
 */
@Getter
@Builder
public class TaProfileStatusResponse {

    /**
     * Current workflow status label: NOT_CREATED | DRAFT | SUBMITTED | APPROVED | REJECTED.
     * PENDING_REVIEW is mapped to SUBMITTED per DECISION-01.
     */
    private String status;

    private LocalDateTime submittedAt;

    /** DC review comment; non-null only when status is REJECTED. */
    private String reviewComment;
}
