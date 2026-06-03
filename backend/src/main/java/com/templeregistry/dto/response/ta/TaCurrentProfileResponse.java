package com.templeregistry.dto.response.ta;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * The currently-approved published temple profile (from temple_profile_current).
 * Sensitive fields are masked per VAL-008.
 * s3Key and raw encrypted values are never exposed.
 */
@Getter
@Builder
public class TaCurrentProfileResponse {

    private Long id;
    private Long templeId;
    private int version;

    private String phone;
    private String email;
    private String website;
    private String contactPersonName;
    private String contactPersonDesignation;
    private String photoFilePath;

    /** Bank account last 4 digits only (VAL-008). */
    private String bankAccountMasked;

    private String bankName;
    private String bankIfsc;
    private String languagesOfWorship;
    private String linkedInstitutions;
    private String description;
    private String annualFestivals;
    private String landmark;
    private String historicalSignificance;

    private LocalDateTime publishedAt;
    private LocalDateTime updatedAt;
}
