package com.templeregistry.service.impl.dc;

import com.templeregistry.dto.response.dc.DcDashboardResponse;
import com.templeregistry.dto.response.dc.GradeDistributionItem;
import com.templeregistry.repository.temple.TempleSearchSummaryRepository;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DcDashboardServiceImplTest {

    @Mock
    private TempleSearchSummaryRepository summaryRepository;

    @InjectMocks
    private DcDashboardServiceImpl dcDashboardService;

    // â”€â”€ DC role: district-scoped â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    @Test
    void should_returnDistrictScopedKpis_when_roleIsDistrictCollector() {
        ScopeHelper.Claims claims = new ScopeHelper.Claims(1L, RoleConstants.DISTRICT_COLLECTOR, 10L, null, "dc_user", "EDIT");

        when(summaryRepository.countByDistrict(eq(10L))).thenReturn(50L);
        when(summaryRepository.sumPendingDeclarationsByDistrict(eq(10L))).thenReturn(5L);
        when(summaryRepository.sumOverdueDeclarationsByDistrict(eq(10L))).thenReturn(2L);
        when(summaryRepository.sumPendingProfileReviewByDistrict(eq(10L))).thenReturn(3L);
        when(summaryRepository.countWithoutApprovedDeclarationByDistrict(eq(10L))).thenReturn(8L);
        when(summaryRepository.countByGradeForDistrict(eq(10L)))
                .thenReturn(List.of(new Object[]{"A", 20L}, new Object[]{"B", 15L}, new Object[]{"C", 15L}));

        DcDashboardResponse result = dcDashboardService.getDashboard(claims);

        assertThat(result.getTotalTemples()).isEqualTo(50L);
        assertThat(result.getPendingDeclarations()).isEqualTo(5L);
        assertThat(result.getOverdueDeclarations()).isEqualTo(2L);
        assertThat(result.getPendingProfileReviews()).isEqualTo(3L);
        assertThat(result.getTemplesWithoutApprovedDeclaration()).isEqualTo(8L);
        assertThat(result.getGradeDistribution()).hasSize(3);
    }

    @Test
    void should_returnAllDistrictKpis_when_roleIsSuperAdmin() {
        ScopeHelper.Claims claims = new ScopeHelper.Claims(1L, RoleConstants.SUPER_ADMIN, null, null, "admin", "EDIT");

        when(summaryRepository.countByDistrict(null)).thenReturn(200L);
        when(summaryRepository.sumPendingDeclarationsByDistrict(null)).thenReturn(15L);
        when(summaryRepository.sumOverdueDeclarationsByDistrict(null)).thenReturn(7L);
        when(summaryRepository.sumPendingProfileReviewByDistrict(null)).thenReturn(10L);
        when(summaryRepository.countWithoutApprovedDeclarationByDistrict(null)).thenReturn(30L);
        when(summaryRepository.countByGradeForDistrict(null)).thenReturn(List.of());

        DcDashboardResponse result = dcDashboardService.getDashboard(claims);

        assertThat(result.getTotalTemples()).isEqualTo(200L);
        assertThat(result.getGradeDistribution()).isEmpty();
    }

    @Test
    void should_mapGradeDistributionCorrectly_when_repositoryReturnsRawRows() {
        ScopeHelper.Claims claims = new ScopeHelper.Claims(1L, RoleConstants.DISTRICT_COLLECTOR, 5L, null, "dc", "EDIT");

        when(summaryRepository.countByDistrict(eq(5L))).thenReturn(10L);
        when(summaryRepository.sumPendingDeclarationsByDistrict(eq(5L))).thenReturn(0L);
        when(summaryRepository.sumOverdueDeclarationsByDistrict(eq(5L))).thenReturn(0L);
        when(summaryRepository.sumPendingProfileReviewByDistrict(eq(5L))).thenReturn(0L);
        when(summaryRepository.countWithoutApprovedDeclarationByDistrict(eq(5L))).thenReturn(0L);
        when(summaryRepository.countByGradeForDistrict(eq(5L)))
                .thenReturn(List.of(new Object[]{"A", 6L}, new Object[]{"B", 4L}));

        DcDashboardResponse result = dcDashboardService.getDashboard(claims);

        List<GradeDistributionItem> dist = result.getGradeDistribution();
        assertThat(dist).extracting(GradeDistributionItem::getGrade).containsExactly("A", "B");
        assertThat(dist).extracting(GradeDistributionItem::getCount).containsExactly(6L, 4L);
    }

    @Test
    void should_useDistrictIdFromClaims_when_roleIsDcStaff() {
        ScopeHelper.Claims claims = new ScopeHelper.Claims(2L, RoleConstants.DC_STAFF, 7L, null, "dc_staff", "EDIT");

        when(summaryRepository.countByDistrict(eq(7L))).thenReturn(25L);
        when(summaryRepository.sumPendingDeclarationsByDistrict(eq(7L))).thenReturn(0L);
        when(summaryRepository.sumOverdueDeclarationsByDistrict(eq(7L))).thenReturn(0L);
        when(summaryRepository.sumPendingProfileReviewByDistrict(eq(7L))).thenReturn(0L);
        when(summaryRepository.countWithoutApprovedDeclarationByDistrict(eq(7L))).thenReturn(0L);
        when(summaryRepository.countByGradeForDistrict(eq(7L))).thenReturn(List.of());

        DcDashboardResponse result = dcDashboardService.getDashboard(claims);

        assertThat(result.getTotalTemples()).isEqualTo(25L);
    }
}
