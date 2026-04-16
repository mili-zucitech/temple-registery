package com.templeregistry.dto.response.ta;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Activity/audit summary derived from the temple's profile staging history.
 * Provides a quick view of the last significant lifecycle events.
 */
@Getter
@Builder
public class TaActivityResponse {

    /** Timestamp of the most recent profile staging record update. */
    private LocalDateTime lastProfileUpdate;

    /** Timestamp when the latest staging record was submitted for DC review. Null if never submitted. */
    private LocalDateTime lastSubmission;

    /** Timestamp when the DC last reviewed (approved or rejected). Null if never reviewed. */
    private LocalDateTime lastReviewedAt;

    /**
     * Action of the last DC review: "APPROVED" or "REJECTED".
     * Null if the DC has not yet reviewed any submission.
     */
    private String lastReviewAction;
}
