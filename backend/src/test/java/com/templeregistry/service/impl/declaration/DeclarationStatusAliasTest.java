package com.templeregistry.service.impl.declaration;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.response.declaration.DeclarationResponse;
import com.templeregistry.entity.declaration.AssetDeclaration;
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
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import org.junit.jupiter.api.Disabled;

/**
 * Exploratory bug-condition tests for the CLARIFICATION_REQUESTED → CLARIFICATION_REQUIRED alias.
 *
 * Task 1.1: Direct enum valueOf test — MUST FAIL on unfixed code.
 * Task 1.2: Service-level listByDistrict test — MUST FAIL on unfixed code.
 *
 * These tests confirm the root cause:
 *   DeclarationStatus.valueOf("CLARIFICATION_REQUESTED") throws IllegalArgumentException
 *   because CLARIFICATION_REQUESTED was renamed to CLARIFICATION_REQUIRED in migration V42.
 */
class DeclarationStatusAliasTest {

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
                Mockito.mock(com.templeregistry.service.notification.NotificationHelper.class),
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
     * Task 1.1 — Direct enum valueOf test.
     *
     * On unfixed code, DeclarationStatus.valueOf("CLARIFICATION_REQUESTED") throws
     * IllegalArgumentException because the constant was renamed to CLARIFICATION_REQUIRED.
     * This test asserts the legacy name resolves to CLARIFICATION_REQUIRED via fromValue().
     * EXPECTED TO FAIL on unfixed code (confirms the bug exists).
     */
    @Test
    void valueOf_CLARIFICATION_REQUESTED_should_resolve_to_CLARIFICATION_REQUIRED() {
        // On unfixed code this throws:
        //   IllegalArgumentException: No enum constant
        //   com.templeregistry.entity.declaration.DeclarationStatus.CLARIFICATION_REQUESTED
        DeclarationStatus result = DeclarationStatus.fromValue("CLARIFICATION_REQUESTED");
        assertThat(result).isEqualTo(DeclarationStatus.CLARIFICATION_REQUIRED);
    }

    /**
     * Task 1.2 — Service-level listByDistrict test.
     *
     * Calls listByDistrict with status="CLARIFICATION_REQUESTED" against a mocked repository
     * and asserts no exception is thrown.
     * EXPECTED TO FAIL on unfixed code (confirms the bug exists).
     */
    @Test
    void listByDistrict_with_CLARIFICATION_REQUESTED_should_not_throw() {
        // Arrange: repository returns an empty page for any status query
        AssetDeclaration declaration = AssetDeclaration.builder()
                .id(1L)
                .templeId(10L)
                .districtId(5L)
                .status(DeclarationStatus.CLARIFICATION_REQUIRED)
                .build();

        when(declarationRepository.findAllByDistrictIdAndStatus(
                eq(5L), eq(DeclarationStatus.CLARIFICATION_REQUIRED), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(declaration)));

        // Act & Assert: no exception should be thrown
        assertThatCode(() ->
                declarationService.listByDistrict(5L, "CLARIFICATION_REQUESTED", null, 0, 10)
        ).doesNotThrowAnyException();
    }
}
