package com.templeregistry.service.impl.declaration;

import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.util.PaginationUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Fix-checking tests for the CLARIFICATION_REQUESTED → CLARIFICATION_REQUIRED alias resolution.
 *
 * These tests verify Property 1 (Bug Condition) from the design document:
 * For any status query parameter value where isBugCondition returns true
 * (i.e., the value is CLARIFICATION_REQUESTED, case-insensitively), the fixed
 * listByDistrict method SHALL resolve the value to DeclarationStatus.CLARIFICATION_REQUIRED
 * and return a result without throwing any exception.
 *
 * Validates: Requirements 2.1, 2.2
 */
class DeclarationStatusFixCheckTest {

    private DeclarationRepository declarationRepository;
    private TempleRepository templeRepository;
    private PaginationUtil paginationUtil;
    private DeclarationServiceImpl declarationService;

    @BeforeEach
    void setUp() {
        declarationRepository = Mockito.mock(DeclarationRepository.class);
        templeRepository = Mockito.mock(TempleRepository.class);
        paginationUtil = Mockito.mock(PaginationUtil.class);

        when(paginationUtil.clampSize(Mockito.anyInt())).thenReturn(20);
        when(templeRepository.findAllById(any())).thenReturn(Collections.emptyList());

        // Stub the repository to return an empty page for any status + district query
        when(declarationRepository.findAllByDistrictIdAndStatus(
                eq(5L), eq(DeclarationStatus.CLARIFICATION_REQUIRED), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        declarationService = new DeclarationServiceImpl(
                declarationRepository,
                Mockito.mock(com.templeregistry.repository.declaration.DeclarationClarificationRepository.class),
                Mockito.mock(com.templeregistry.repository.declaration.AssetDeclarationVersionRepository.class),
                templeRepository,
                Mockito.mock(com.templeregistry.security.OwnershipGuard.class),
                Mockito.mock(com.templeregistry.security.JurisdictionGuard.class),
                Mockito.mock(com.templeregistry.util.StatusTransitionValidator.class),
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
                Mockito.mock(com.templeregistry.service.declaration.StateTransitionValidator.class),
                Mockito.mock(com.templeregistry.service.notification.NotificationHelper.class)
        );

        // Mock security context so @PreAuthorize doesn't interfere
        SecurityContext ctx = Mockito.mock(SecurityContext.class);
        Authentication auth = Mockito.mock(Authentication.class);
        when(ctx.getAuthentication()).thenReturn(auth);
        when(auth.getPrincipal()).thenReturn(
                Mockito.mock(com.templeregistry.security.ScopeHelper.Claims.class));
        SecurityContextHolder.setContext(ctx);
    }

    /**
     * Task 3.1 — Upper-case legacy alias.
     *
     * Verifies that listByDistrict with status="CLARIFICATION_REQUESTED" (upper-case)
     * invokes the repository with DeclarationStatus.CLARIFICATION_REQUIRED and does not throw.
     *
     * Validates: Requirements 2.1, 2.2
     */
    @Test
    void listByDistrict_with_CLARIFICATION_REQUESTED_uppercase_should_not_throw() {
        assertThatCode(() ->
                declarationService.listByDistrict(5L, "CLARIFICATION_REQUESTED", null, 0, 10)
        ).doesNotThrowAnyException();
    }

    /**
     * Task 3.2 — Lower-case legacy alias.
     *
     * Verifies that listByDistrict with status="clarification_requested" (lower-case)
     * invokes the repository with DeclarationStatus.CLARIFICATION_REQUIRED and does not throw.
     *
     * Validates: Requirements 2.1, 2.2
     */
    @Test
    void listByDistrict_with_clarification_requested_lowercase_should_not_throw() {
        assertThatCode(() ->
                declarationService.listByDistrict(5L, "clarification_requested", null, 0, 10)
        ).doesNotThrowAnyException();
    }

    /**
     * Task 3.3 — Mixed-case legacy alias.
     *
     * Verifies that listByDistrict with status="Clarification_Requested" (mixed-case)
     * invokes the repository with DeclarationStatus.CLARIFICATION_REQUIRED and does not throw.
     *
     * Validates: Requirements 2.1, 2.2
     */
    @Test
    void listByDistrict_with_Clarification_Requested_mixedcase_should_not_throw() {
        assertThatCode(() ->
                declarationService.listByDistrict(5L, "Clarification_Requested", null, 0, 10)
        ).doesNotThrowAnyException();
    }

    /**
     * Task 3.4 — Mock-based repository argument verification.
     *
     * Verifies that listByDistrict with status="CLARIFICATION_REQUESTED" explicitly
     * invokes the repository with DeclarationStatus.CLARIFICATION_REQUIRED as the
     * status argument (not the raw legacy string).
     *
     * Validates: Requirements 2.1, 2.2
     */
    @Test
    void listByDistrict_with_CLARIFICATION_REQUESTED_invokes_repository_with_CLARIFICATION_REQUIRED() {
        // Act
        declarationService.listByDistrict(5L, "CLARIFICATION_REQUESTED", null, 0, 10);

        // Assert: repository was called with the canonical enum value, not the legacy alias
        verify(declarationRepository).findAllByDistrictIdAndStatus(
                eq(5L), eq(DeclarationStatus.CLARIFICATION_REQUIRED), any(Pageable.class));
    }
}
