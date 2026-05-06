package com.templeregistry.service.impl.admin;

import com.templeregistry.dto.response.admin.StatewideDashboardResponse.GradeDistributionItem;
import com.templeregistry.dto.response.admin.StatewideDashboardResponse;
import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.repository.audit.AuditDataEventRepository;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.temple.TempleSearchSummaryRepository;
import com.templeregistry.service.admin.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final TempleSearchSummaryRepository searchSummaryRepository;
    private final UserRepository userRepository;
    private final AuditDataEventRepository auditDataEventRepository;

    @Override
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Transactional(readOnly = true)
    public StatewideDashboardResponse getStatewideDashboard() {
        long totalTemples       = searchSummaryRepository.countByDistrict(null);
        long totalPending       = searchSummaryRepository.sumPendingDeclarationsByDistrict(null);
        long totalOverdue       = searchSummaryRepository.sumOverdueDeclarationsByDistrict(null);
        long totalPendingProfile = searchSummaryRepository.sumPendingProfileReviewByDistrict(null);

        long active    = searchSummaryRepository.countAll("ACTIVE");
        long suspended = searchSummaryRepository.countAll("SUSPENDED");

        long totalUsers   = userRepository.count();
        long superAdmins  = userRepository.countByRole(UserRole.SUPER_ADMIN);
        long dcs          = userRepository.countByRole(UserRole.DISTRICT_COLLECTOR);
        long dcStaff      = userRepository.countByRole(UserRole.DC_STAFF);
        long tas          = userRepository.countByRole(UserRole.TEMPLE_AUTHORITY);
        long auditors     = userRepository.countByRole(UserRole.AUDITOR);

        long recentAuditCount = auditDataEventRepository.count();

        List<StatewideDashboardResponse.DistrictDistributionItem> districtDist =
                searchSummaryRepository.countByDistrict().stream()
                        .map(row -> StatewideDashboardResponse.DistrictDistributionItem.builder()
                                .districtId(row[0] != null ? ((Number) row[0]).longValue() : null)
                                .count(((Number) row[1]).longValue())
                                .build())
                        .toList();

        List<GradeDistributionItem> gradeDist =
                searchSummaryRepository.countByGradeForDistrict(null).stream()
                        .map(row -> GradeDistributionItem.builder()
                                .grade(row[0] != null ? row[0].toString() : "UNKNOWN")
                                .count(((Number) row[1]).longValue())
                                .build())
                        .toList();

        return StatewideDashboardResponse.builder()
                .totalTemples(totalTemples)
                .totalActiveTemples(active)
                .totalSuspendedTemples(suspended)
                .totalPendingDeclarations(totalPending)
                .totalOverdueDeclarations(totalOverdue)
                .totalPendingProfileReviews(totalPendingProfile)
                .totalUsers(totalUsers)
                .totalSuperAdmins(superAdmins)
                .totalDistrictCollectors(dcs)
                .totalDcStaff(dcStaff)
                .totalTempleAuthorities(tas)
                .totalAuditors(auditors)
                .recentAuditEventCount(recentAuditCount)
                .districtDistribution(districtDist)
                .gradeDistribution(gradeDist)
                .build();
    }
}
