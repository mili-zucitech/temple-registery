package com.templeregistry.dto.response.governance;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.templeregistry.entity.governance.DcDecisionStatus;
import com.templeregistry.entity.governance.PhysicalVerificationStatus;
import com.templeregistry.entity.governance.SubmissionStatus;
import com.templeregistry.entity.governance.SystemVerificationStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Full governance status view for DC and DC Staff.
 *
 * Contains all 3 layers plus physical verification status (declarations only).
 * MUST NEVER be returned to Temple Authority.
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DcGovernanceStatusResponse {

    /** Layer 1 */
    private SubmissionStatus submissionStatus;

    /** Layer 2 — INTERNAL, DC-only */
    private SystemVerificationStatus systemVerificationStatus;

    /** Layer 3 */
    private DcDecisionStatus dcDecisionStatus;

    /** Send back reason (if any) */
    private String sendBackReason;

    /**
     * Physical verification status — declarations only.
     * DC-only field.
     */
    private PhysicalVerificationStatus physicalVerificationStatus;

    private LocalDateTime physicalVerificationOrderedAt;
    private Long physicalVerificationOrderedBy;
    private LocalDateTime physicalVerificationCompletedAt;
}
