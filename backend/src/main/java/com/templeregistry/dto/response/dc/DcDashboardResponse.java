package com.templeregistry.dto.response.dc;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * DC Dashboard KPI response.
 *
 * Aggregated from temple_search_summary for the principal's district.
 * All counts are district-scoped; SUPER_ADMIN receives totals across all districts.
 * dc_e2e Section 7.1 — DC Dashboard.
 */
@Getter
@Builder
public class DcDashboardResponse {

    /** Total registered temples in the district. */
    private long totalTemples;

    /** Declarations requiring DC attention (PENDING_REVIEW + CLARIFICATION_REQUESTED + PHYSICAL_VERIFICATION_REQUESTED). */
    private long pendingDeclarations;

    /** Declarations past their due date and still active. */
    private long overdueDeclarations;

    /** Temple profile staging submissions awaiting DC review. */
    private long pendingProfileReviews;

    /** Temples with no approved declaration on record. */
    private long templesWithoutApprovedDeclaration;

    /** Count per grade — used for pie/bar chart. */
    private List<GradeDistributionItem> gradeDistribution;
}
