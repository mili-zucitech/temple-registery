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
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DcTempleSearchServiceImpl implements DcTempleSearchService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final int DEFAULT_PAGE_SIZE = 10;

    /** Allowed sort fields — prevents PropertyReferenceException on arbitrary user input. */
    private static final java.util.Set<String> ALLOWED_SORT_FIELDS = java.util.Set.of(
            "name", "grade", "yearEstablished", "assetDeclarationStatus",
            "districtId", "trustRegistered", "pendingDeclarations", "overdueDeclarations"
    );

    private final TempleSearchSummaryRepository summaryRepository;

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.CAN_READ_TEMPLES)
    public PaginatedResponse<DcTempleSearchItemResponse> search(TempleSearchFilterRequest filter,
                                                                ScopeHelper.Claims claims) {
        // Enforce district scope: DC roles always use their own districtId from JWT
        Long effectiveDistrictId = resolveDistrictId(filter, claims);

        // Clamp page and size to safe values — prevents IllegalArgumentException from PageRequest
        int size = Math.min(Math.max(filter.getSize() != null ? filter.getSize() : DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
        int page = Math.max(filter.getPage() != null ? filter.getPage() : 0, 0);
        Sort sort = parseSort(filter.getSort());

        Specification<TempleSearchSummary> spec = buildSpec(filter, effectiveDistrictId);
        Page<TempleSearchSummary> result = summaryRepository.findAll(spec, PageRequest.of(page, size, sort));

        log.info("DC temple search: districtId={} page={} size={} total={}", effectiveDistrictId, page, size, result.getTotalElements());

        return PaginatedResponse.of(result.map(this::toResponse));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Long resolveDistrictId(TempleSearchFilterRequest filter, ScopeHelper.Claims claims) {
        // All roles now use the filter parameter — DC approval restriction is enforced
        // in JurisdictionGuard.assertDistrictScope(), not here.
        return filter.getDistrictId();
    }

    private Specification<TempleSearchSummary> buildSpec(TempleSearchFilterRequest filter, Long districtId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            log.debug("DC temple search buildSpec: effectiveDistrictId={} talukId={} hobliId={}",
                    districtId, filter.getTalukId(), filter.getHobliId());

            if (districtId != null) {
                predicates.add(cb.equal(root.get("districtId"), districtId));
            } else if (filter.getCityId() != null) {
                // cityId is only meaningful when no district-level restriction is active.
                // DC/DC_STAFF always have districtId from JWT; only SUPER_ADMIN reaches here.
                predicates.add(cb.equal(root.get("cityId"), filter.getCityId()));
            }
            // Apply geo refinement at the lowest selected level — filters are mutually exclusive:
            // hobliId (most specific) wins; talukId is used only when hobliId is absent.
            // This prevents conflicting predicates when the user selects hobliId (which implies its taluk).
            if (filter.getHobliId() != null) {
                predicates.add(cb.equal(root.get("hobliId"), filter.getHobliId()));
            } else if (filter.getTalukId() != null) {
                predicates.add(cb.equal(root.get("talukId"), filter.getTalukId()));
            }
            if (StringUtils.hasText(filter.getKeyword())) {
                String keyword = filter.getKeyword().trim();
                if (keyword.length() < 2) {
                    // Prevent expensive contains-search for 0-1 char inputs (scans even with indexes).
                    log.debug("DC temple search: ignoring too-short keyword (len={})", keyword.length());
                } else {
                    if (keyword.length() > 100) keyword = keyword.substring(0, 100);
                // Escape SQL LIKE wildcards so user input is treated as a literal substring.
                String safe = keyword
                        .replace("\\", "\\\\")
                        .replace("%",  "\\%")
                        .replace("_",  "\\_");
                String pattern = "%" + safe.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(root.get("registrationNumber")), pattern),
                        cb.like(cb.lower(root.get("primaryDeity")), pattern)
                ));
                }
            }
            if (StringUtils.hasText(filter.getDeityName())) {
                String deity = filter.getDeityName().trim();
                if (deity.length() < 2) {
                    log.debug("DC temple search: ignoring too-short deityName (len={})", deity.length());
                } else {
                    if (deity.length() > 100) deity = deity.substring(0, 100);
                String safeDeity = deity
                        .replace("\\", "\\\\")
                        .replace("%",  "\\%")
                        .replace("_",  "\\_");
                predicates.add(cb.like(cb.lower(root.get("primaryDeity")),
                        "%" + safeDeity.toLowerCase() + "%"));
                }
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
            if (filter.getHasApprovedDeclaration() != null) {
                predicates.add(cb.equal(root.get("hasApprovedDeclaration"), filter.getHasApprovedDeclaration()));
            }
            if (filter.getPendingProfileReview() != null) {
                predicates.add(cb.equal(root.get("pendingProfileReview"), filter.getPendingProfileReview() ? 1 : 0));
            }
            if (filter.getGrade() != null && !filter.getGrade().isEmpty()) {
                // Frontend sends grade as a comma-joined string (e.g. "A,B").
                // Spring binds that as a List with one element "A,B", not ["A","B"].
                // Defensively expand each element by splitting on comma.
                List<String> expanded = filter.getGrade().stream()
                        .flatMap(g -> Arrays.stream(g.split(",")))
                        .map(String::trim)
                        .filter(g -> !g.isEmpty())
                        .collect(Collectors.toList());
                if (!expanded.isEmpty()) {
                    predicates.add(root.get("grade").in(expanded));
                }
            }
            if (filter.getEstablishedYearFrom() != null || filter.getEstablishedYearTo() != null) {
                Integer from = filter.getEstablishedYearFrom();
                Integer to   = filter.getEstablishedYearTo();
                // Silently swap inverted range instead of failing — prevents confusing empty results.
                if (from != null && to != null && from > to) {
                    log.warn("DC temple search: inverted year range ({} > {}), swapping automatically", from, to);
                    Integer tmp = from; from = to; to = tmp;
                }
                if (from != null) predicates.add(cb.greaterThanOrEqualTo(root.get("yearEstablished"), from));
                if (to   != null) predicates.add(cb.lessThanOrEqualTo(root.get("yearEstablished"),   to));
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
        // Reject unknown sort fields — prevents PropertyReferenceException from JPA.
        if (!ALLOWED_SORT_FIELDS.contains(field)) {
            log.warn("DC temple search: unknown sort field '{}', falling back to 'name'", field);
            field = "name";
        }
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
                .trustRegistered(Boolean.TRUE.equals(s.getTrustRegistered()))
                .assetDeclarationStatus(s.getAssetDeclarationStatus())
                .yearEstablished(s.getYearEstablished())
                .photoUrl(s.getPhotoUrl())
                .pendingDeclarations(s.getPendingDeclarations() != null ? s.getPendingDeclarations() : 0)
                .overdueDeclarations(s.getOverdueDeclarations() != null ? s.getOverdueDeclarations() : 0)
                .pendingProfileReview(s.getPendingProfileReview() != null ? s.getPendingProfileReview() : 0)
                .hasActiveTrust(Boolean.TRUE.equals(s.getHasActiveTrust()))
                .hasApprovedDeclaration(Boolean.TRUE.equals(s.getHasApprovedDeclaration()))
                .lastDeclarationAt(s.getLastDeclarationAt())
                .lastProfileUpdateAt(s.getLastProfileUpdateAt())
                .build();
    }
}
