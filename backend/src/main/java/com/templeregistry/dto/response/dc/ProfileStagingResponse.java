package com.templeregistry.dto.response.dc;

import com.templeregistry.dto.response.governance.GovernanceStatusPayload;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Temple profile staging submission for DC review.
 * dc_e2e Section 5.3 — Profile staging workflow.
 */
@Getter
@Builder
public class ProfileStagingResponse {

    private Long id;
    private Long templeId;
    private int version;
    private String status;

    /** Canonical governance status — single source of truth for allowedActions / UI state. */
    private GovernanceStatusPayload governanceStatus;

    // Content fields
    private String contactPersonName;
    private String contactPersonDesignation;
    private String phone;
    private String email;
    private String photoUrl;
    private String bankName;
    private String bankAccountNumberMasked;
    private String bankIfsc;
    private String languagesOfWorship;
    private String linkedInstitutions;
    private String description;
    private String annualFestivals;
    private String landmark;
    private String historicalSignificance;

    // Review metadata
    private LocalDateTime submittedAt;
    private Long submittedBy;
    private LocalDateTime reviewedAt;
    private Long reviewedBy;
    private String reviewComment;
}
