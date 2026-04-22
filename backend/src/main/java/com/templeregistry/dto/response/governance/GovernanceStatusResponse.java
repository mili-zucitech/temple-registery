package com.templeregistry.dto.response.governance;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.templeregistry.entity.governance.DcDecisionStatus;
import com.templeregistry.entity.governance.SubmissionStatus;
import lombok.Builder;
import lombok.Getter;

/**
 * Governance status view for Temple Authority.
 *
 * STRICT RULES:
 * - Contains ONLY submissionStatus, dcDecisionStatus, and sendBackReason.
 * - systemVerificationStatus is EXCLUDED.
 * - physicalVerificationStatus is EXCLUDED.
 * - No history, no timeline.
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GovernanceStatusResponse {

    /** Layer 1 — always visible to TA. */
    private SubmissionStatus submissionStatus;

    /** Layer 3 — always visible to TA. */
    private DcDecisionStatus dcDecisionStatus;

    /**
     * Free-text reason from DC when status is SENT_BACK.
     * Null when not sent back.
     */
    private String sendBackReason;
}
