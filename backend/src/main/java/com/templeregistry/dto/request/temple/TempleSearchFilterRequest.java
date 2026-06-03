package com.templeregistry.dto.request.temple;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TempleSearchFilterRequest {

    private Long districtId;
    private Long cityId;
    private Long talukId;
    private Long hobliId;
    private List<String> grade;          // ["A","B","C"]
    @Size(max = 200) private String keyword;              // partial match on name
    @Size(max = 200) private String deityName;
    private String tradition;
    private Boolean trustRegistered;
    /**
     * Declaration filter key from Temple Directory.
     * Supports workflow statuses (SUBMITTED, UNDER_REVIEW, ...), grouped keys
     * (PENDING, VERIFICATION_REQUIRED), and special keys (NO_DECLARATION, OVERDUE).
     */
    private String declarationStatus;
    /** Filter by whether the temple has any approved declaration on record. */
    private Boolean hasApprovedDeclaration;
    /** Filter by whether a profile staging review is pending for the temple. */
    private Boolean pendingProfileReview;
    @Min(0) private Integer establishedYearFrom;
    @Min(0) private Integer establishedYearTo;

    // Pagination
    @Builder.Default @Min(0) private Integer page = 0;
    @Builder.Default @Min(1) @Max(100) private Integer size = 10;
    @Builder.Default private String sort = "name,asc";
}
