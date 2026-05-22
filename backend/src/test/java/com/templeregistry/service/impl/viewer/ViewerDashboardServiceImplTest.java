package com.templeregistry.service.impl.viewer;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.response.auditor.ComplianceAnomalyResponse;
import com.templeregistry.dto.response.viewer.ViewerDashboardResponse;
import com.templeregistry.service.auditor.AuditorService;
import com.templeregistry.service.observation.ObservationService;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ViewerDashboardServiceImplTest {

    @Mock AuditorService auditorService;
    @Mock ObservationService observationService;

    @InjectMocks
    ViewerDashboardServiceImpl service;

    @Nested
    class GetDashboard {

        @Test
        void should_returnDashboard_when_noAnomalies() {
            when(auditorService.getComplianceReport()).thenReturn(Collections.emptyList());
            PaginatedResponse<Object> emptyPage = mock(PaginatedResponse.class);
            when(emptyPage.getTotalElements()).thenReturn(0L);
            when(observationService.listByStatus(eq("OPEN"), anyInt(), anyInt())).thenReturn((PaginatedResponse) emptyPage);
            when(observationService.listByStatus(eq("ASSIGNED"), anyInt(), anyInt())).thenReturn((PaginatedResponse) emptyPage);

            ViewerDashboardResponse response = service.getDashboard();

            assertThat(response).isNotNull();
            assertThat(response.getComplianceAnomalyCount()).isEqualTo(0);
            assertThat(response.getOverdueDeclarationCount()).isEqualTo(0);
            assertThat(response.getComplianceScore()).isEqualTo(100);
            assertThat(response.getWorkloadStatus()).isEqualTo("Stable");
            assertThat(response.getRecentAnomalies()).isEmpty();
        }

        @Test
        void should_calculateComplianceScore_when_anomaliesPresent() {
            // 5 anomalies, 2 overdue: 100 - 5*3 - 2*4 = 100 - 15 - 8 = 77
            List<ComplianceAnomalyResponse> anomalies = List.of(
                buildAnomaly("MISSING_TRUST"),
                buildAnomaly("MISSING_TRUST"),
                buildAnomaly("MISSING_TRUST"),
                buildAnomaly("OVERDUE_DECLARATION"),
                buildAnomaly("OVERDUE_DECLARATION")
            );
            when(auditorService.getComplianceReport()).thenReturn(anomalies);
            PaginatedResponse<Object> emptyPage = mock(PaginatedResponse.class);
            when(emptyPage.getTotalElements()).thenReturn(0L);
            when(observationService.listByStatus(eq("OPEN"), anyInt(), anyInt())).thenReturn((PaginatedResponse) emptyPage);
            when(observationService.listByStatus(eq("ASSIGNED"), anyInt(), anyInt())).thenReturn((PaginatedResponse) emptyPage);

            ViewerDashboardResponse response = service.getDashboard();

            assertThat(response.getComplianceAnomalyCount()).isEqualTo(5);
            assertThat(response.getOverdueDeclarationCount()).isEqualTo(2);
            assertThat(response.getComplianceScore()).isEqualTo(77);
        }

        @Test
        void should_capComplianceScoreAtZero_when_manyAnomalies() {
            // 100 anomalies: score would be very negative → clamped to 0
            List<ComplianceAnomalyResponse> anomalies = Collections.nCopies(100, buildAnomaly("MISSING_TRUST"));
            when(auditorService.getComplianceReport()).thenReturn(anomalies);
            PaginatedResponse<Object> emptyPage = mock(PaginatedResponse.class);
            when(emptyPage.getTotalElements()).thenReturn(0L);
            when(observationService.listByStatus(eq("OPEN"), anyInt(), anyInt())).thenReturn((PaginatedResponse) emptyPage);
            when(observationService.listByStatus(eq("ASSIGNED"), anyInt(), anyInt())).thenReturn((PaginatedResponse) emptyPage);

            ViewerDashboardResponse response = service.getDashboard();

            assertThat(response.getComplianceScore()).isEqualTo(0);
        }

        @Test
        void should_returnHighLoad_when_openObservationsExceed20() {
            when(auditorService.getComplianceReport()).thenReturn(Collections.emptyList());
            PaginatedResponse<Object> openPage = mock(PaginatedResponse.class);
            PaginatedResponse<Object> assignedPage = mock(PaginatedResponse.class);
            when(openPage.getTotalElements()).thenReturn(25L);
            when(assignedPage.getTotalElements()).thenReturn(0L);
            when(observationService.listByStatus(eq("OPEN"), anyInt(), anyInt())).thenReturn((PaginatedResponse) openPage);
            when(observationService.listByStatus(eq("ASSIGNED"), anyInt(), anyInt())).thenReturn((PaginatedResponse) assignedPage);

            ViewerDashboardResponse response = service.getDashboard();

            assertThat(response.getWorkloadStatus()).isEqualTo("High load");
        }

        @Test
        void should_returnMediumLoad_when_openObservationsBetween9And20() {
            when(auditorService.getComplianceReport()).thenReturn(Collections.emptyList());
            PaginatedResponse<Object> openPage = mock(PaginatedResponse.class);
            PaginatedResponse<Object> assignedPage = mock(PaginatedResponse.class);
            when(openPage.getTotalElements()).thenReturn(15L);
            when(assignedPage.getTotalElements()).thenReturn(0L);
            when(observationService.listByStatus(eq("OPEN"), anyInt(), anyInt())).thenReturn((PaginatedResponse) openPage);
            when(observationService.listByStatus(eq("ASSIGNED"), anyInt(), anyInt())).thenReturn((PaginatedResponse) assignedPage);

            ViewerDashboardResponse response = service.getDashboard();

            assertThat(response.getWorkloadStatus()).isEqualTo("Medium load");
        }

        @Test
        void should_limitRecentAnomaliesTo8_when_manyAnomaliesExist() {
            List<ComplianceAnomalyResponse> anomalies = Collections.nCopies(20, buildAnomaly("MISSING_TRUST"));
            when(auditorService.getComplianceReport()).thenReturn(anomalies);
            PaginatedResponse<Object> emptyPage = mock(PaginatedResponse.class);
            when(emptyPage.getTotalElements()).thenReturn(0L);
            when(observationService.listByStatus(eq("OPEN"), anyInt(), anyInt())).thenReturn((PaginatedResponse) emptyPage);
            when(observationService.listByStatus(eq("ASSIGNED"), anyInt(), anyInt())).thenReturn((PaginatedResponse) emptyPage);

            ViewerDashboardResponse response = service.getDashboard();

            assertThat(response.getRecentAnomalies()).hasSize(8);
        }

        private ComplianceAnomalyResponse buildAnomaly(String type) {
            return ComplianceAnomalyResponse.builder()
                .anomalyType(type)
                .build();
        }
    }
}
