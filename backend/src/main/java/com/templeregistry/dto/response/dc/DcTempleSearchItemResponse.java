package com.templeregistry.dto.response.dc;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * DC temple search result item — projected from temple_search_summary.
 *
 * Richer than the base TempleSearchResultResponse: includes DC-specific
 * aggregated counts (pending/overdue declarations, profile review status)
 * from the precomputed summary table.
 * dc_e2e Section 3.1 — Temple List / Search.
 */
@Getter
@Builder
public class DcTempleSearchItemResponse {

    private Long templeId;
    private String registrationNumber;
    private String name;
    private String grade;
    private String primaryDeity;
    private String tradition;
    private Long hobliId;
    private Long talukId;
    private Long districtId;
    private Long cityId;
    private String templeStatus;
    private boolean trustRegistered;
    private String assetDeclarationStatus;
    private Integer yearEstablished;
    private String photoUrl;

    // DC-specific aggregated counts
    private int pendingDeclarations;
    private int overdueDeclarations;
    private int pendingProfileReview;
    private boolean hasActiveTrust;
    private boolean hasApprovedDeclaration;
    private LocalDateTime lastDeclarationAt;
    private LocalDateTime lastProfileUpdateAt;
}
