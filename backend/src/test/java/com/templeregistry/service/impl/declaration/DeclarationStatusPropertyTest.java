package com.templeregistry.service.impl.declaration;

import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.util.PaginationUtil;
import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.From;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import net.jqwik.api.lifecycle.BeforeTry;
import org.mockito.Mockito;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Arrays;
import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.junit.jupiter.api.Disabled;

/**
 * Property-based tests for the CLARIFICATION_REQUESTED alias fix.
 *
 * Task 5.1 — Preservation Property (Validates: Requirements 3.1, 3.2)
 * Task 5.2 — Unknown-Value Property (Validates: Requirement 3.4)
 */
class DeclarationStatusPropertyTest {

    /** All valid current enum constant names, used to filter out known values in task 5.2. */
    private static final Set<String> VALID_STATUS_NAMES =
            Arrays.stream(DeclarationStatus.values())
                  .map(Enum::name)
                  .collect(Collectors.toSet());

    /** The only legacy alias currently defined in LEGACY_ALIASES. */
    private static final String LEGACY_ALIAS = "CLARIFICATION_REQUESTED";

    private DeclarationRepository declarationRepository;
    private TempleRepository templeRepository;
    private PaginationUtil paginationUtil;
    private DeclarationServiceImpl declarationService;

    @BeforeTry
    void setUp() {
        declarationRepository = Mockito.mock(DeclarationRepository.class);
        templeRepository = Mockito.mock(TempleRepository.class);
        paginationUtil = Mockito.mock(PaginationUtil.class);

        when(paginationUtil.clampSize(Mockito.anyInt())).thenReturn(20);
        when(templeRepository.findAllById(any())).thenReturn(Collections.emptyList());

        // Stub the no-filter path
        when(declarationRepository.findAllByDistrictIdExcludingDraft(eq(5L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        // Stub the status-filtered path for every current enum constant
        for (DeclarationStatus s : DeclarationStatus.values()) {
            when(declarationRepository.findAllByDistrictIdAndStatus(eq(5L), eq(s), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(Collections.emptyList()));
        }

        declarationService = new DeclarationServiceImpl(
                declarationRepository,
                Mockito.mock(com.templeregistry.repository.declaration.DeclarationClarificationRepository.class),
                Mockito.mock(com.templeregistry.repository.declaration.AssetDeclarationVersionRepository.class),
                templeRepository,
                Mockito.mock(com.templeregistry.security.OwnershipGuard.class),
                Mockito.mock(com.templeregistry.security.JurisdictionGuard.class),
                Mockito.mock(com.templeregistry.util.AcknowledgementNumberGenerator.class),
                Mockito.mock(com.templeregistry.service.dc.NotificationEventPublisher.class),
                paginationUtil,
                Mockito.mock(com.templeregistry.service.audit.AuditService.class),
                Mockito.mock(com.templeregistry.service.audit.GovernanceAuditService.class),
                Mockito.mock(com.templeregistry.repository.auth.UserRepository.class),
                Mockito.mock(com.fasterxml.jackson.databind.ObjectMapper.class),
                Mockito.mock(com.templeregistry.service.document.FileStorageService.class),
                Mockito.mock(com.templeregistry.repository.dc.DeclImmovAgriLandRepository.class),
                Mockito.mock(com.templeregistry.repository.dc.DeclImmovBuildingRepository.class),
                Mockito.mock(com.templeregistry.repository.dc.DeclImmovLeasedRepository.class),
                Mockito.mock(com.templeregistry.repository.dc.DeclImmovOtherRepository.class),
                Mockito.mock(com.templeregistry.repository.dc.DeclMovPreciousMetalRepository.class),
                Mockito.mock(com.templeregistry.repository.dc.DeclMovArtifactRepository.class),
                Mockito.mock(com.templeregistry.repository.dc.DeclMovVehicleRepository.class),
                Mockito.mock(com.templeregistry.repository.dc.DeclMovEquipmentRepository.class),
                Mockito.mock(com.templeregistry.repository.dc.DeclMovFinancialRepository.class),
                Mockito.mock(com.templeregistry.mapper.declaration.DeclarationAssetMapper.class),
                Mockito.mock(com.templeregistry.service.governance.GovernanceEditGuard.class),
                Mockito.mock(com.templeregistry.service.declaration.SnapshotService.class),
                Mockito.mock(com.templeregistry.service.audit.DeclarationAuditLogService.class),
                Mockito.mock(com.templeregistry.service.workflow.WorkflowEngineAdaptor.class),
                Mockito.mock(com.templeregistry.service.workflow.WorkflowEngine.class),
                Mockito.mock(com.templeregistry.service.governance.GovernanceStatusResolver.class)
        );

        // Mock security context so @PreAuthorize doesn't interfere
        SecurityContext ctx = Mockito.mock(SecurityContext.class);
        Authentication auth = Mockito.mock(Authentication.class);
        when(ctx.getAuthentication()).thenReturn(auth);
        when(auth.getPrincipal()).thenReturn(
                Mockito.mock(com.templeregistry.security.ScopeHelper.Claims.class));
        SecurityContextHolder.setContext(ctx);
    }

    // ─── Providers ────────────────────────────────────────────────────────────

    /**
     * Generates random values from the set of all current DeclarationStatus constant names.
     */
    @Provide
    Arbitrary<String> validStatusNames() {
        String[] names = Arrays.stream(DeclarationStatus.values())
                               .map(Enum::name)
                               .toArray(String[]::new);
        return Arbitraries.of(names);
    }

    /**
     * Generates random strings that are neither a legacy alias nor a valid DeclarationStatus
     * constant name. Uses alphanumeric strings of length 1–30, filtered to exclude known values.
     */
    @Provide
    Arbitrary<String> unknownStatusStrings() {
        return Arbitraries.strings()
                .alpha()
                .ofMinLength(1)
                .ofMaxLength(30)
                .map(String::toUpperCase)
                .filter(s -> !VALID_STATUS_NAMES.contains(s))
                .filter(s -> !LEGACY_ALIAS.equals(s));
    }

    // ─── Task 5.1 — Preservation Property ────────────────────────────────────

    /**
     * For every current DeclarationStatus constant name, listByDistrict must invoke the
     * repository with that exact same constant — no unintended remapping occurs.
     *
     * **Validates: Requirements 3.1, 3.2**
     */
    @Property
    void listByDistrict_with_any_valid_status_name_invokes_repository_with_same_constant(
            @ForAll @From("validStatusNames") String statusName) {

        DeclarationStatus expected = DeclarationStatus.valueOf(statusName);

        // Act
        declarationService.listByDistrict(5L, statusName, null, 0, 10);

        // Assert: repository was called with the exact same constant — no remapping occurred
        verify(declarationRepository).findAllByDistrictIdAndStatus(
                eq(5L), eq(expected), any(Pageable.class));
    }

    // ─── Task 5.2 — Unknown-Value Property ───────────────────────────────────

    /**
     * For any string that is neither a legacy alias nor a valid DeclarationStatus constant,
     * listByDistrict must throw an exception — unknown values must not be silently swallowed.
     *
     * **Validates: Requirement 3.4**
     */
    @Property
    void listByDistrict_with_unknown_status_always_throws(
            @ForAll @From("unknownStatusStrings") String unknownStatus) {

        assertThatThrownBy(() ->
                declarationService.listByDistrict(5L, unknownStatus, null, 0, 10)
        ).isInstanceOf(Exception.class);
    }
}
