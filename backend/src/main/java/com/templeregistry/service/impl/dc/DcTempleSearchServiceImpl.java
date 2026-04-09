package com.templeregistry.service.impl.dc;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.temple.TempleSearchFilterRequest;
import com.templeregistry.dto.response.dc.DcTempleSearchItemResponse;
import com.templeregistry.entity.temple.TempleSearchSummary;
import com.templeregistry.repository.temple.TempleSearchSummaryRepository;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.dc.DcTempleSearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DcTempleSearchServiceImpl implements DcTempleSearchService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final int DEFAULT_PAGE_SIZE = 10;

    private final TempleSearchSummaryRepository summaryRepository;

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.CAN_READ_ALL)
    public PaginatedResponse<DcTempleSearchItemResponse> search(TempleSearchFilterRequest filter,
                                                                ScopeHelper.Claims claims) {
        // Enforce district scope: DC roles always use their own districtId from JWT
        Long effectiveDistrictId = resolveDistrictId(filter, claims);

        int size = Math.min(filter.getSize() != null ? filter.getSize() : DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
        int page = filter.getPage() != null ? filter.getPage() : 0;
        Sort sort = parseSort(filter.getSort());

        Specification<TempleSearchSummary> spec = buildSpec(filter, effectiveDistrictId);
        Page<TempleSearchSummary> result = summaryRepository.findAll(spec, PageRequest.of(page, size, sort));

        log.info("DC temple search: districtId={} page={} size={} total={}", effectiveDistrictId, page, size, result.getTotalElements());

        return PaginatedResponse.of(result.map(this::toResponse));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Long resolveDistrictId(TempleSearchFilterRequest filter, ScopeHelper.Claims claims) {
        String role = claims.role();
        if (RoleConstants.DISTRICT_COLLECTOR.equals(role) || RoleConstants.DC_STAFF.equals(role)) {
            return claims.districtId(); // JWT always wins for DC roles
        }
        return filter.getDistrictId(); // SUPER_ADMIN / AUDITOR may filter or leave null
    }

    private Specification<TempleSearchSummary> buildSpec(TempleSearchFilterRequest filter, Long districtId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (districtId != null) {
                predicates.add(cb.equal(root.get("districtId"), districtId));
            }
            if (filter.getTalukId() != null) {
                predicates.add(cb.equal(root.get("talukId"), filter.getTalukId()));
            }
            if (filter.getHobliId() != null) {
                predicates.add(cb.equal(root.get("hobliId"), filter.getHobliId()));
            }
            if (StringUtils.hasText(filter.getKeyword())) {
                String pattern = "%" + filter.getKeyword().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(root.get("registrationNumber")), pattern)
                ));
            }
            if (StringUtils.hasText(filter.getDeityName())) {
                predicates.add(cb.like(cb.lower(root.get("primaryDeity")),
                        "%" + filter.getDeityName().toLowerCase() + "%"));
            }
            if (StringUtils.hasText(filter.getTradition())) {
                predicates.add(cb.equal(root.get("tradition"), filter.getTradition()));
            }
            if (filter.getTrustRegistered() != null) {
                predicates.add(cb.equal(root.get("trustRegistered"), filter.getTrustRegistered()));
            }
            if (StringUtils.hasText(filter.getDeclarationStatus())) {
                predicates.add(cb.equal(root.get("assetDeclarationStatus"), filter.getDeclarationStatus()));
            }
            if (filter.getGrade() != null && !filter.getGrade().isEmpty()) {
                predicates.add(root.get("grade").in(filter.getGrade()));
            }
            if (filter.getEstablishedYearFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("yearEstablished"), filter.getEstablishedYearFrom()));
            }
            if (filter.getEstablishedYearTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("yearEstablished"), filter.getEstablishedYearTo()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Sort parseSort(String sortParam) {
        if (!StringUtils.hasText(sortParam)) {
            return Sort.by(Sort.Direction.ASC, "name");
        }
        String[] parts = sortParam.split(",");
        String field = parts[0].trim();
        Sort.Direction direction = parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim())
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        return Sort.by(direction, field);
    }

    private DcTempleSearchItemResponse toResponse(TempleSearchSummary s) {
        return DcTempleSearchItemResponse.builder()
                .templeId(s.getTempleId())
                .registrationNumber(s.getRegistrationNumber())
                .name(s.getName())
                .grade(s.getGrade())
                .primaryDeity(s.getPrimaryDeity())
                .tradition(s.getTradition())
                .hobliId(s.getHobliId())
                .talukId(s.getTalukId())
                .districtId(s.getDistrictId())
                .cityId(s.getCityId())
                .templeStatus(s.getTempleStatus())
                .trustRegistered(s.isTrustRegistered())
                .assetDeclarationStatus(s.getAssetDeclarationStatus())
                .yearEstablished(s.getYearEstablished())
                .photoUrl(s.getPhotoUrl())
                .pendingDeclarations(s.getPendingDeclarations())
                .overdueDeclarations(s.getOverdueDeclarations())
                .pendingProfileReview(s.getPendingProfileReview())
                .hasActiveTrust(s.isHasActiveTrust())
                .hasApprovedDeclaration(s.isHasApprovedDeclaration())
                .lastDeclarationAt(s.getLastDeclarationAt())
                .lastProfileUpdateAt(s.getLastProfileUpdateAt())
                .build();
    }
}
