package com.templeregistry.service.impl.declaration;

import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.util.PaginationUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mockito;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.junit.jupiter.api.Disabled;

/**
 * Preservation-checking tests for the CLARIFICATION_REQUESTED alias fix.
 *
 * These tests verify Property 2 (Unchanged Behavior) from the design document:
 * For any status query parameter value where isBugCondition returns false
 * (i.e., the value is null, blank, a valid current enum constant, or a genuinely
 * unknown string), the fixed listByDistrict method SHALL produce exactly the same
 * result as the original method.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 */
class DeclarationStatusPreservationTest {

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

        // Stub the no-filter path
        when(declarationRepository.findAllByDistrictIdExcludingDraft(eq(5L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        // Stub the status-filtered path for any status + district 5
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
                Mockito.mock(com.templeregistry.service.workflow.WorkflowEngine.class)
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
     * Task 4.1 — Every current DeclarationStatus constant is passed through unchanged.
     *
     * For each enum constant, listByDistrict with status=constant.name() must invoke
     * the repository with that exact same constant — no unintended remapping.
     *
     * Validates: Requirements 3.1, 3.2
     */
    @ParameterizedTest
    @EnumSource(DeclarationStatus.class)
    void listByDistrict_with_any_current_status_name_invokes_repository_with_same_constant(DeclarationStatus status) {
        // Act
        declarationService.listByDistrict(5L, status.name(), null, 0, 10);

        // Assert: repository was called with the exact same constant — no remapping occurred
        verify(declarationRepository).findAllByDistrictIdAndStatus(
                eq(5L), eq(status), any(Pageable.class));
    }

    /**
     * Task 4.2 — Completely unknown status values still throw an exception.
     *
     * The fix must not silently swallow unknown values. Passing a string that is
     * neither a legacy alias nor a valid enum constant must still throw.
     *
     * Validates: Requirement 3.4
     */
    @Test
    void listByDistrict_with_totally_unknown_status_throws_exception() {
        assertThatThrownBy(() ->
                declarationService.listByDistrict(5L, "TOTALLY_UNKNOWN", null, 0, 10)
        ).isInstanceOf(Exception.class);
    }

    /**
     * Task 4.3 — Null status calls the no-filter repository method.
     *
     * When status is null, listByDistrict must call findAllByDistrictIdExcludingDraft,
     * not the status-filtered method.
     *
     * Validates: Requirement 3.3
     */
    @Test
    void listByDistrict_with_null_status_calls_findAllByDistrictIdExcludingDraft() {
        // Act
        declarationService.listByDistrict(5L, null, null, 0, 10);

        // Assert: no-filter path was used
        verify(declarationRepository).findAllByDistrictIdExcludingDraft(eq(5L), any(Pageable.class));
    }

    /**
     * Task 4.4 — Blank status calls the no-filter repository method.
     *
     * When status is an empty string, listByDistrict must call
     * findAllByDistrictIdExcludingDraft, not the status-filtered method.
     *
     * Validates: Requirement 3.3
     */
    @Test
    void listByDistrict_with_blank_status_calls_findAllByDistrictIdExcludingDraft() {
        // Act
        declarationService.listByDistrict(5L, "", null, 0, 10);

        // Assert: no-filter path was used
        verify(declarationRepository).findAllByDistrictIdExcludingDraft(eq(5L), any(Pageable.class));
    }

    /**
     * Task 4.5 — SUBMITTED is passed through to the repository unchanged.
     *
     * Verifies that a valid current status value (SUBMITTED) is not remapped
     * and the repository is called with DeclarationStatus.SUBMITTED.
     *
     * Validates: Requirement 3.2
     */
    @Test
    void listByDistrict_with_SUBMITTED_invokes_repository_with_SUBMITTED() {
        // Act
        declarationService.listByDistrict(5L, "SUBMITTED", null, 0, 10);

        // Assert: repository was called with the canonical SUBMITTED constant
        verify(declarationRepository).findAllByDistrictIdAndStatus(
                eq(5L), eq(DeclarationStatus.SUBMITTED), any(Pageable.class));
    }

    /**
     * Task 4.6 — CLARIFICATION_REQUIRED (canonical) is passed through unchanged.
     *
     * Verifies that the canonical value CLARIFICATION_REQUIRED is not remapped
     * and the repository is called with DeclarationStatus.CLARIFICATION_REQUIRED.
     *
     * Validates: Requirement 3.1
     */
    @Test
    void listByDistrict_with_CLARIFICATION_REQUIRED_invokes_repository_with_CLARIFICATION_REQUIRED() {
        // Act
        declarationService.listByDistrict(5L, "CLARIFICATION_REQUIRED", null, 0, 10);

        // Assert: canonical value is passed through unchanged — not remapped to anything else
        verify(declarationRepository).findAllByDistrictIdAndStatus(
                eq(5L), eq(DeclarationStatus.CLARIFICATION_REQUIRED), any(Pageable.class));
    }
}
