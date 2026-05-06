package com.templeregistry.dto.response.admin;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * Statewide dashboard aggregation for SUPER_ADMIN.
 * Aggregated from temple_search_summary (denormalized).
 */
@Getter
@Builder
public class StatewideDashboardResponse {

    private long totalTemples;
    private long totalActiveTemples;
    private long totalSuspendedTemples;
    private long totalPendingDeclarations;
    private long totalOverdueDeclarations;
    private long totalPendingProfileReviews;
    private long totalUsers;
    private long totalSuperAdmins;
    private long totalDistrictCollectors;
    private long totalDcStaff;
    private long totalTempleAuthorities;
    private long totalAuditors;
    private long recentAuditEventCount;

    /** Temples per district — for trend chart. */
    private List<DistrictDistributionItem> districtDistribution;

    /** Temples per grade — for pie chart. */
    private List<GradeDistributionItem> gradeDistribution;

    @Getter
    @Builder
    public static class DistrictDistributionItem {
        private Long districtId;
        private long count;
    }

    @Getter
    @Builder
    public static class GradeDistributionItem {
        private String grade;
        private long count;
    }
}
