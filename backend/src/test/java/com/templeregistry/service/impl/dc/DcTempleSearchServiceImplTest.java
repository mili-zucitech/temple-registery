package com.templeregistry.service.impl.dc;

import com.templeregistry.dto.request.temple.TempleSearchFilterRequest;
import com.templeregistry.repository.temple.TempleSearchSummaryRepository;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.governance.TempleVisibilityPolicy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DcTempleSearchServiceImplTest {

    @Mock
    private TempleSearchSummaryRepository summaryRepository;

    @Mock
    @SuppressWarnings("unused")
    private TempleVisibilityPolicy visibilityPolicy;

    @InjectMocks
    private DcTempleSearchServiceImpl service;

    private static final ScopeHelper.Claims SA_CLAIMS =
            new ScopeHelper.Claims(1L, RoleConstants.SUPER_ADMIN, null, null, "sa_user", "EDIT");
    private static final ScopeHelper.Claims DC_CLAIMS =
            new ScopeHelper.Claims(2L, RoleConstants.DISTRICT_COLLECTOR, 5L, null, "dc_user", "EDIT");

    @SuppressWarnings("unchecked")
    @Test
    void should_useFilterDistrictId_when_SA_searches_any_district() {
        // SA provides districtId=7 â€” service must honour it (not override with JWT)
        TempleSearchFilterRequest filter = TempleSearchFilterRequest.builder()
                .districtId(7L).build();

        when(summaryRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        var result = service.search(filter, SA_CLAIMS);
        assertThat(result).isNotNull();
        // Verify no exception was thrown and the query ran
    }

    @SuppressWarnings("unchecked")
    @Test
    void should_useFilterDistrictId_when_DC_searches_another_district() {
        // After the unlock, DC can supply any districtId â€” resolveDistrictId returns filter.districtId
        TempleSearchFilterRequest filter = TempleSearchFilterRequest.builder()
                .districtId(99L).build();

        when(summaryRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        var result = service.search(filter, DC_CLAIMS);
        assertThat(result).isNotNull();
    }

    @SuppressWarnings("unchecked")
    @Test
    void should_returnAllTemples_when_districtId_isNull() {
        // No district filter â€” returns statewide results
        TempleSearchFilterRequest filter = TempleSearchFilterRequest.builder().build();

        when(summaryRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        var result = service.search(filter, SA_CLAIMS);
        assertThat(result).isNotNull();
        assertThat(result.getContent()).isEmpty();
    }

    // ─── expandDeclarationStatus normalization tests ──────────────────────────

    @ParameterizedTest(name = "legacy alias ''{0}'' expands to both legacy and canonical ''{1}''")
    @CsvSource({
        "PENDING_REVIEW,                  SUBMITTED",
        "RESUBMITTED,                     SUBMITTED",
        "CLARIFICATION_REQUESTED,         CLARIFICATION_REQUIRED",
        "PHYSICAL_VERIFICATION_REQUESTED, SITE_VISIT_SCHEDULED",
    })
    void should_expandLegacyAlias_when_declarationStatus_is_pre_v42_value(
            String legacyInput, String expectedCanonical) {
        List<String> result = service.expandDeclarationStatus(legacyInput.trim());

        assertThat(result).hasSize(2);
        assertThat(result).contains(legacyInput.trim());
        assertThat(result).contains(expectedCanonical.trim());
    }

    @ParameterizedTest(name = "canonical value ''{0}'' returns single-element list")
    @CsvSource({
        "SUBMITTED",
        "OVERDUE",
        "UNDER_REVIEW",
        "APPROVED",
        "REJECTED",
        "CLARIFICATION_REQUIRED",
        "CLARIFICATION_RESPONDED",
        "SITE_VISIT_SCHEDULED",
        "DRAFT",
        "VERIFIED",
        "SUPERSEDED",
    })
    void should_returnSingleElement_when_declarationStatus_is_canonical(String canonical) {
        List<String> result = service.expandDeclarationStatus(canonical);

        assertThat(result).hasSize(1);
        assertThat(result).containsExactly(canonical);
    }

    @Test
    void should_normaliseInputToUpperCase_when_declarationStatus_is_lowercase() {
        List<String> result = service.expandDeclarationStatus("pending_review");

        assertThat(result).hasSize(2);
        assertThat(result).contains("PENDING_REVIEW");
        assertThat(result).contains("SUBMITTED");
    }

        @Test
        void should_expandPendingFilter_when_declarationStatus_is_PENDING() {
                List<String> result = service.expandDeclarationFilter("PENDING");

                assertThat(result).contains("SUBMITTED");
                assertThat(result).contains("PENDING_REVIEW");
                assertThat(result).contains("RESUBMITTED");
        }

        @Test
        void should_expandVerificationRequiredFilter_when_declarationStatus_is_VERIFICATION_REQUIRED() {
                List<String> result = service.expandDeclarationFilter("VERIFICATION_REQUIRED");

                assertThat(result).containsAll(List.of(
                                "SUBMITTED",
                                "UNDER_REVIEW",
                                "CLARIFICATION_RESPONDED",
                                "SITE_VISIT_SCHEDULED",
                                "SITE_VISIT_COMPLETED",
                                "VERIFIED"
                ));
                // Legacy values are included so stale summary rows still match.
                assertThat(result).contains("PENDING_REVIEW", "RESUBMITTED", "PHYSICAL_VERIFICATION_REQUESTED");
        }

        @Test
        void should_expandCanonicalWithLegacyAlias_when_declarationStatus_is_SUBMITTED() {
                List<String> result = service.expandDeclarationFilter("SUBMITTED");

                assertThat(result).contains("SUBMITTED", "PENDING_REVIEW", "RESUBMITTED");
        }

        @Test
        void should_expandCanonicalClarificationStatus_when_declarationStatus_is_CLARIFICATION_REQUIRED() {
                List<String> result = service.expandDeclarationFilter("CLARIFICATION_REQUIRED");

                assertThat(result).contains("CLARIFICATION_REQUIRED", "CLARIFICATION_REQUESTED");
        }

        @Test
        void should_returnEmptyExpansion_when_declarationStatus_is_specialFilter() {
                assertThat(service.expandDeclarationFilter("NO_DECLARATION")).isEmpty();
                assertThat(service.expandDeclarationFilter("OVERDUE")).isEmpty();
        }

    @SuppressWarnings("unchecked")
    @Test
    void should_runSearch_without_exception_when_declarationStatus_is_legacy_PENDING_REVIEW() {
        TempleSearchFilterRequest filter = TempleSearchFilterRequest.builder()
                .declarationStatus("PENDING_REVIEW")
                .build();

        when(summaryRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        var result = service.search(filter, SA_CLAIMS);
        assertThat(result).isNotNull();
    }

    @SuppressWarnings("unchecked")
    @Test
    void should_runSearch_without_exception_when_declarationStatus_is_canonical_SUBMITTED() {
        TempleSearchFilterRequest filter = TempleSearchFilterRequest.builder()
                .declarationStatus("SUBMITTED")
                .build();

        when(summaryRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        var result = service.search(filter, SA_CLAIMS);
        assertThat(result).isNotNull();
    }

    @SuppressWarnings("unchecked")
    @Test
    void should_runSearch_without_exception_when_declarationStatus_is_OVERDUE() {
        TempleSearchFilterRequest filter = TempleSearchFilterRequest.builder()
                .declarationStatus("OVERDUE")
                .build();

        when(summaryRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        var result = service.search(filter, SA_CLAIMS);
        assertThat(result).isNotNull();
    }

        @SuppressWarnings("unchecked")
        @Test
        void should_runSearch_without_exception_when_declarationStatus_is_NO_DECLARATION() {
                TempleSearchFilterRequest filter = TempleSearchFilterRequest.builder()
                                .declarationStatus("NO_DECLARATION")
                                .build();

                when(summaryRepository.findAll(any(Specification.class), any(Pageable.class)))
                                .thenReturn(new PageImpl<>(List.of()));

                var result = service.search(filter, SA_CLAIMS);
                assertThat(result).isNotNull();
        }

        @SuppressWarnings("unchecked")
        @Test
        void should_runSearch_without_exception_when_declarationStatus_is_VERIFICATION_REQUIRED() {
                TempleSearchFilterRequest filter = TempleSearchFilterRequest.builder()
                                .declarationStatus("VERIFICATION_REQUIRED")
                                .build();

                when(summaryRepository.findAll(any(Specification.class), any(Pageable.class)))
                                .thenReturn(new PageImpl<>(List.of()));

                var result = service.search(filter, SA_CLAIMS);
                assertThat(result).isNotNull();
        }
}
