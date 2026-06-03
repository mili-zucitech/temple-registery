package com.templeregistry.service.impl.viewer;

import com.templeregistry.dto.response.auditor.ComplianceAnomalyResponse;
import com.templeregistry.dto.response.viewer.ViewerDashboardResponse;
import com.templeregistry.service.auditor.AuditorService;
import com.templeregistry.service.observation.ObservationService;
import com.templeregistry.service.viewer.ViewerDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ViewerDashboardServiceImpl implements ViewerDashboardService {

    private final AuditorService auditorService;
    private final ObservationService observationService;

    @Override
    @Transactional(readOnly = true)
    public ViewerDashboardResponse getDashboard() {
        List<ComplianceAnomalyResponse> allAnomalies = auditorService.getComplianceReport();

        int anomalyCount = allAnomalies.size();
        int overdueCount = (int) allAnomalies.stream()
                .filter(a -> "OVERDUE_DECLARATION".equals(a.getAnomalyType()))
                .count();

        long openObsCount = observationService.listByStatus("OPEN", 0, 1).getTotalElements();
        long assignedObsCount = observationService.listByStatus("ASSIGNED", 0, 1).getTotalElements();

        int scoreBase = Math.max(0, 100 - anomalyCount * 3 - overdueCount * 4);
        int complianceScore = Math.max(0, Math.min(100, scoreBase));

        String workloadStatus = openObsCount > 20 ? "High load"
                : openObsCount > 8 ? "Medium load"
                : "Stable";

        List<ComplianceAnomalyResponse> recentAnomalies = allAnomalies.stream()
                .limit(8)
                .toList();

        return ViewerDashboardResponse.builder()
                .complianceAnomalyCount(anomalyCount)
                .overdueDeclarationCount(overdueCount)
                .openObservationCount(openObsCount)
                .assignedObservationCount(assignedObsCount)
                .complianceScore(complianceScore)
                .workloadStatus(workloadStatus)
                .recentAnomalies(recentAnomalies)
                .build();
    }
}
