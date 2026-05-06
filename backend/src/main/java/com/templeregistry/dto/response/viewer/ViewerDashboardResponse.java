package com.templeregistry.dto.response.viewer;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * Lightweight KPI response for the Viewer dashboard.
 * Derived from statewide compliance and observation data — no new DB queries.
 */
@Getter
@Builder
public class ViewerDashboardResponse {

    /** Total number of temples with at least one active compliance anomaly. */
    private int complianceAnomalyCount;

    /** Number of anomalies of type OVERDUE_DECLARATION. */
    private int overdueDeclarationCount;

    /** Total open observations statewide. */
    private long openObservationCount;

    /** Total assigned observations statewide. */
    private long assignedObservationCount;

    /**
     * Computed compliance score (0–100).
     * Decremented by anomalies and overdue declarations.
     */
    private int complianceScore;

    /** Workload indicator: "Stable" / "Medium load" / "High load". */
    private String workloadStatus;

    /** Up to 8 most recent compliance anomalies for the dashboard table. */
    private List<com.templeregistry.dto.response.auditor.ComplianceAnomalyResponse> recentAnomalies;
}
