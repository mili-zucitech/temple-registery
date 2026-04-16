package com.templeregistry.dto.response.temple;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Response for a temple profile staging record.
 * statusLabel maps PENDING_REVIEW → "SUBMITTED" per DECISION-01
 * so the frontend never sees the internal enum name.
 */
@Getter
@Builder
public class TempleProfileStagingResponse {

    private Long id;
    private Long templeId;
    private int versionNumber;

    /** The display-friendly label: DRAFT, SUBMITTED, APPROVED, REJECTED, SUPERSEDED. */
    private String statusLabel;

    private String phone;
    private String email;
    private String website;
    private String contactPersonName;
    private String contactPersonDesignation;
    private String photoFilePath;

    /** Bank account: last 4 digits only (VAL-008). Never echoes full number. */
    private String bankAccountMasked;

    private String bankName;
    private String bankIfsc;
    private java.util.List<String> languagesOfWorship;
    private java.util.List<String> linkedInstitutions;
    private String description;
    private String annualFestivals;
    private String landmark;
    private String historicalSignificance;
    private String reviewComment;
    private LocalDateTime submittedAt;
    private Long submittedBy;
    private LocalDateTime reviewedAt;
    private Long reviewedBy;
    private LocalDateTime createdAt;
    private Long createdBy;
    private LocalDateTime updatedAt;
    private Long updatedBy;
}
