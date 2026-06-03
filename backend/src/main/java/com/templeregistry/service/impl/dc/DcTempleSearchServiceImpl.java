package com.templeregistry.service.impl.dc;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.temple.TempleSearchFilterRequest;
import com.templeregistry.dto.response.dc.DcTempleSearchItemResponse;
import com.templeregistry.entity.temple.TempleSearchSummary;
import com.templeregistry.repository.temple.TempleSearchSummaryRepository;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.dc.DcTempleSearchService;
import com.templeregistry.service.governance.TempleVisibilityPolicy;
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
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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

        /**
         * Backward-compatible legacy declaration aliases from pre-V42 values.
         * Key = legacy value, value = canonical value used by current backend.
         */
        private static final Map<String, String> DECLARATION_STATUS_ALIASES = Map.of(
            "PENDING_REVIEW",                  "SUBMITTED",
            "RESUBMITTED",                     "SUBMITTED",
            "CLARIFICATION_REQUESTED",         "CLARIFICATION_REQUIRED",
            "PHYSICAL_VERIFICATION_REQUESTED", "SITE_VISIT_SCHEDULED"
        );

        /** Reverse lookup so canonical filters also match stale legacy summary rows. */
        private static final Map<String, List<String>> CANONICAL_TO_LEGACY = Map.of(
            "SUBMITTED", List.of("PENDING_REVIEW", "RESUBMITTED"),
            "CLARIFICATION_REQUIRED", List.of("CLARIFICATION_REQUESTED"),
            "SITE_VISIT_SCHEDULED", List.of("PHYSICAL_VERIFICATION_REQUESTED")
        );

        /**
         * Saved filter + chip semantics for Temple Directory declaration filtering.
         *
         * PENDING = freshly submitted declarations awaiting initial DC action.
         * VERIFICATION_REQUIRED = all in-flight verification states under DC workflow.
         */
        private static final Map<String, List<String>> DECLARATION_FILTER_GROUPS = Map.of(
            "PENDING", List.of("SUBMITTED"),
            "VERIFICATION_REQUIRED", List.of(
                "SUBMITTED",
                "UNDER_REVIEW",
                "CLARIFICATION_RESPONDED",
                "SITE_VISIT_SCHEDULED",
                "SITE_VISIT_COMPLETED",
                "VERIFIED"
            )
        );

    private final TempleSearchSummaryRepository summaryRepository;
    private final TempleVisibilityPolicy visibilityPolicy;

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

        return PaginatedResponse.of(result.map(s -> toResponse(s, claims)));
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
                String normalizedStatus = filter.getDeclarationStatus().trim().toUpperCase();
                if ("NO_DECLARATION".equals(normalizedStatus)) {
                    predicates.add(cb.isNull(root.get("assetDeclarationStatus")));
                } else if ("OVERDUE".equals(normalizedStatus)) {
                    predicates.add(cb.greaterThan(root.get("overdueDeclarations"), 0));
                } else {
                    List<String> statusValues = expandDeclarationFilter(normalizedStatus);
                    if (statusValues.isEmpty()) {
                        // No status values means the filter key maps to a non-status predicate
                        // (handled above) or an unsupported input that should produce no-op.
                        log.warn("DC temple search: unsupported declarationStatus '{}'", normalizedStatus);
                    } else if (statusValues.size() == 1) {
                        predicates.add(cb.equal(root.get("assetDeclarationStatus"), statusValues.get(0)));
                    } else {
                        predicates.add(root.get("assetDeclarationStatus").in(statusValues));
                    }
                }
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

    /** Package-private for unit testing; do not call from outside this package. */
    List<String> expandDeclarationStatus(String input) {
        String upper = input.trim().toUpperCase();
        String canonical = DECLARATION_STATUS_ALIASES.get(upper);
        if (canonical != null) {
            // Return both the legacy alias and canonical form so the query matches mixed-state rows.
            return List.of(upper, canonical);
        }
        return List.of(upper);
    }

    /**
     * Expands a declaration filter value to all matched DB status values.
     * This handles both grouped filter keys (e.g. VERIFICATION_REQUIRED) and
     * canonical/legacy one-to-one status values.
     */
    List<String> expandDeclarationFilter(String input) {
        String normalized = input.trim().toUpperCase();
        if ("NO_DECLARATION".equals(normalized) || "OVERDUE".equals(normalized)) {
            return List.of();
        }

        List<String> baseStatuses = DECLARATION_FILTER_GROUPS.getOrDefault(normalized, List.of(normalized));
        Set<String> expanded = new LinkedHashSet<>();

        for (String base : baseStatuses) {
            String upper = base.trim().toUpperCase();
            expanded.add(upper);

            // If input/base is a legacy alias, include canonical.
            String canonical = DECLARATION_STATUS_ALIASES.get(upper);
            if (canonical != null) {
                expanded.add(canonical);
            }

            // If input/base is canonical, include known legacy aliases so stale rows still match.
            List<String> legacyValues = CANONICAL_TO_LEGACY.get(upper);
            if (legacyValues != null) {
                expanded.addAll(legacyValues);
            }
        }

        return List.copyOf(expanded);
    }

    private DcTempleSearchItemResponse toResponse(TempleSearchSummary s, ScopeHelper.Claims claims) {
        boolean showGovernance = visibilityPolicy.canViewGovernance(claims, s.getTempleId());
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
                // Governance counts — hidden for TEMPLE_AUTHORITY viewing other temples.
                // showGovernance = false yields 0 so TA search cards never show urgent/review styling
                // for temples they do not manage.
                .pendingDeclarations(showGovernance && s.getPendingDeclarations() != null ? s.getPendingDeclarations() : 0)
                .overdueDeclarations(showGovernance && s.getOverdueDeclarations() != null ? s.getOverdueDeclarations() : 0)
                .pendingProfileReview(showGovernance && s.getPendingProfileReview() != null ? s.getPendingProfileReview() : 0)
                .hasActiveTrust(Boolean.TRUE.equals(s.getHasActiveTrust()))
                .hasApprovedDeclaration(showGovernance && Boolean.TRUE.equals(s.getHasApprovedDeclaration()))
                .lastDeclarationAt(s.getLastDeclarationAt())
                .lastProfileUpdateAt(s.getLastProfileUpdateAt())
                .build();
    }
}
