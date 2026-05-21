package com.templeregistry.service.impl.admin;

import com.templeregistry.dto.response.admin.StatewideDashboardResponse;
import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.repository.audit.AuditDataEventRepository;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.geo.DistrictRepository;
import com.templeregistry.repository.temple.TempleSearchSummaryRepository;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminDashboardServiceImplTest {

    @Mock TempleSearchSummaryRepository searchSummaryRepository;
    @Mock UserRepository userRepository;
    @Mock AuditDataEventRepository auditDataEventRepository;
    @Mock DistrictRepository districtRepository;

    @InjectMocks
    AdminDashboardServiceImpl service;

    @Nested
    class GetStatewideDashboard {

        @Test
        void should_returnDashboard_when_repositoriesReturnData() {
            when(searchSummaryRepository.countByDistrict(null)).thenReturn(150L);
            when(searchSummaryRepository.sumPendingDeclarationsByDistrict(null)).thenReturn(12L);
            when(searchSummaryRepository.sumOverdueDeclarationsByDistrict(null)).thenReturn(3L);
            when(searchSummaryRepository.sumPendingProfileReviewByDistrict(null)).thenReturn(7L);
            when(searchSummaryRepository.countAll("ACTIVE")).thenReturn(140L);
            when(searchSummaryRepository.countAll("SUSPENDED")).thenReturn(10L);
            when(userRepository.count()).thenReturn(50L);
            when(userRepository.countByRole(UserRole.SUPER_ADMIN)).thenReturn(2L);
            when(userRepository.countByRole(UserRole.DISTRICT_COLLECTOR)).thenReturn(5L);
            when(userRepository.countByRole(UserRole.DC_STAFF)).thenReturn(8L);
            when(userRepository.countByRole(UserRole.TEMPLE_AUTHORITY)).thenReturn(30L);
            when(userRepository.countByRole(UserRole.AUDITOR)).thenReturn(5L);
            when(auditDataEventRepository.count()).thenReturn(1000L);
            when(searchSummaryRepository.countByDistrict()).thenReturn(List.of());
            when(searchSummaryRepository.countByGradeForDistrict(null)).thenReturn(List.of());

            StatewideDashboardResponse response = service.getStatewideDashboard();

            assertThat(response).isNotNull();
            assertThat(response.getTotalTemples()).isEqualTo(150L);
            assertThat(response.getTotalActiveTemples()).isEqualTo(140L);
            assertThat(response.getTotalSuspendedTemples()).isEqualTo(10L);
            assertThat(response.getTotalPendingDeclarations()).isEqualTo(12L);
            assertThat(response.getTotalOverdueDeclarations()).isEqualTo(3L);
            assertThat(response.getTotalPendingProfileReviews()).isEqualTo(7L);
            assertThat(response.getTotalUsers()).isEqualTo(50L);
            assertThat(response.getRecentAuditEventCount()).isEqualTo(1000L);
        }

        @Test
        void should_returnUserRoleCounts_when_repositoriesReturnRoleData() {
            when(searchSummaryRepository.countByDistrict(null)).thenReturn(0L);
            when(searchSummaryRepository.sumPendingDeclarationsByDistrict(null)).thenReturn(0L);
            when(searchSummaryRepository.sumOverdueDeclarationsByDistrict(null)).thenReturn(0L);
            when(searchSummaryRepository.sumPendingProfileReviewByDistrict(null)).thenReturn(0L);
            when(searchSummaryRepository.countAll("ACTIVE")).thenReturn(0L);
            when(searchSummaryRepository.countAll("SUSPENDED")).thenReturn(0L);
            when(userRepository.count()).thenReturn(20L);
            when(userRepository.countByRole(UserRole.SUPER_ADMIN)).thenReturn(1L);
            when(userRepository.countByRole(UserRole.DISTRICT_COLLECTOR)).thenReturn(3L);
            when(userRepository.countByRole(UserRole.DC_STAFF)).thenReturn(4L);
            when(userRepository.countByRole(UserRole.TEMPLE_AUTHORITY)).thenReturn(10L);
            when(userRepository.countByRole(UserRole.AUDITOR)).thenReturn(2L);
            when(auditDataEventRepository.count()).thenReturn(0L);
            when(searchSummaryRepository.countByDistrict()).thenReturn(List.of());
            when(searchSummaryRepository.countByGradeForDistrict(null)).thenReturn(List.of());

            StatewideDashboardResponse response = service.getStatewideDashboard();

            assertThat(response.getTotalSuperAdmins()).isEqualTo(1L);
            assertThat(response.getTotalDistrictCollectors()).isEqualTo(3L);
            assertThat(response.getTotalDcStaff()).isEqualTo(4L);
            assertThat(response.getTotalTempleAuthorities()).isEqualTo(10L);
            assertThat(response.getTotalAuditors()).isEqualTo(2L);
        }

        @Test
        void should_returnEmptyDistributions_when_repositoriesReturnEmptyLists() {
            when(searchSummaryRepository.countByDistrict(null)).thenReturn(0L);
            when(searchSummaryRepository.sumPendingDeclarationsByDistrict(null)).thenReturn(0L);
            when(searchSummaryRepository.sumOverdueDeclarationsByDistrict(null)).thenReturn(0L);
            when(searchSummaryRepository.sumPendingProfileReviewByDistrict(null)).thenReturn(0L);
            when(searchSummaryRepository.countAll("ACTIVE")).thenReturn(0L);
            when(searchSummaryRepository.countAll("SUSPENDED")).thenReturn(0L);
            when(userRepository.count()).thenReturn(0L);
            when(userRepository.countByRole(UserRole.SUPER_ADMIN)).thenReturn(0L);
            when(userRepository.countByRole(UserRole.DISTRICT_COLLECTOR)).thenReturn(0L);
            when(userRepository.countByRole(UserRole.DC_STAFF)).thenReturn(0L);
            when(userRepository.countByRole(UserRole.TEMPLE_AUTHORITY)).thenReturn(0L);
            when(userRepository.countByRole(UserRole.AUDITOR)).thenReturn(0L);
            when(auditDataEventRepository.count()).thenReturn(0L);
            when(searchSummaryRepository.countByDistrict()).thenReturn(List.of());
            when(searchSummaryRepository.countByGradeForDistrict(null)).thenReturn(List.of());

            StatewideDashboardResponse response = service.getStatewideDashboard();

            assertThat(response.getDistrictDistribution()).isEmpty();
            assertThat(response.getGradeDistribution()).isEmpty();
        }
    }
}
