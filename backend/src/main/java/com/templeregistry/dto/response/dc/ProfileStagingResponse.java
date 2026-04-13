package com.templeregistry.dto.response.dc;

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

    // Content fields
    private String contactPersonName;
    private String contactPersonDesignation;
    private String phone;
    private String email;
    private String photoFilePath;
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
