package com.templeregistry.dto.response.dc;

import lombok.Builder;
import lombok.Getter;

/**
 * Grade distribution slice — one entry per TempleGrade (A, B, C).
 * Used inside DcDashboardResponse.gradeDistribution.
 */
@Getter
@Builder
public class GradeDistributionItem {
    private String grade;
    private long count;
}
