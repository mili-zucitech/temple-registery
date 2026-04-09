package com.templeregistry.service.impl.dc;

import com.templeregistry.dto.response.dc.DcDashboardResponse;
import com.templeregistry.dto.response.dc.GradeDistributionItem;
import com.templeregistry.repository.temple.TempleSearchSummaryRepository;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.dc.DcDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DcDashboardServiceImpl implements DcDashboardService {

    private final TempleSearchSummaryRepository summaryRepository;

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.CAN_READ_ALL)
    public DcDashboardResponse getDashboard(ScopeHelper.Claims claims) {
        // SUPER_ADMIN: districtId == null → aggregate across all districts
        Long districtId = RoleConstants.SUPER_ADMIN.equals(claims.role()) ? null : claims.districtId();

        long totalTemples                       = summaryRepository.countByDistrict(districtId);
        long pendingDeclarations                = summaryRepository.sumPendingDeclarationsByDistrict(districtId);
        long overdueDeclarations                = summaryRepository.sumOverdueDeclarationsByDistrict(districtId);
        long pendingProfileReviews              = summaryRepository.sumPendingProfileReviewByDistrict(districtId);
        long templesWithoutApprovedDeclaration  = summaryRepository.countWithoutApprovedDeclarationByDistrict(districtId);

        List<Object[]> raw = summaryRepository.countByGradeForDistrict(districtId);
        List<GradeDistributionItem> gradeDistribution = raw.stream()
                .map(row -> GradeDistributionItem.builder()
                        .grade(row[0] != null ? row[0].toString() : "UNGRADED")
                        .count(((Number) row[1]).longValue())
                        .build())
                .toList();

        log.info("DC dashboard loaded: districtId={} totalTemples={}", districtId, totalTemples);

        return DcDashboardResponse.builder()
                .totalTemples(totalTemples)
                .pendingDeclarations(pendingDeclarations)
                .overdueDeclarations(overdueDeclarations)
                .pendingProfileReviews(pendingProfileReviews)
                .templesWithoutApprovedDeclaration(templesWithoutApprovedDeclaration)
                .gradeDistribution(gradeDistribution)
                .build();
    }
}
