package com.templeregistry.service.impl.declaration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.dto.request.declaration.CreateDeclarationRequest;
import com.templeregistry.dto.request.declaration.ClarificationRequest;
import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.declaration.DeclarationClarificationRepository;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.declaration.AssetDeclarationVersionRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.OwnershipGuard;
import com.templeregistry.service.audit.AuditService;
import com.templeregistry.util.AcknowledgementNumberGenerator;
import com.templeregistry.util.PaginationUtil;
import com.templeregistry.util.StatusTransitionValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeclarationServiceImplTest {

    @Mock DeclarationRepository declarationRepository;
    @Mock DeclarationClarificationRepository clarificationRepository;
    @Mock AssetDeclarationVersionRepository versionRepository;
    @Mock TempleRepository templeRepository;
    @Mock OwnershipGuard ownershipGuard;
    @Mock JurisdictionGuard jurisdictionGuard;
    @Mock StatusTransitionValidator transitionValidator;
    @Mock AcknowledgementNumberGenerator ackGenerator;
    @Mock PaginationUtil paginationUtil;
    @Mock AuditService auditService;
    @Mock ObjectMapper objectMapper;
    @Mock com.templeregistry.service.declaration.StateTransitionValidator stateTransitionValidator;
    @Mock com.templeregistry.service.declaration.SnapshotService snapshotService;
    @Mock com.templeregistry.service.audit.DeclarationAuditLogService declarationAuditLogService;
    @Mock com.templeregistry.service.audit.GovernanceAuditService governanceAuditService;
    @Mock com.templeregistry.service.dc.NotificationEventPublisher notificationPublisher;
    @Mock com.templeregistry.repository.auth.UserRepository userRepository;

    @InjectMocks DeclarationServiceImpl declarationService;

    private AssetDeclaration draftDeclaration;

    @BeforeEach
    void setUp() throws Exception {
        draftDeclaration = AssetDeclaration.builder()
                .templeId(1L).districtId(10L)
                .status(DeclarationStatus.DRAFT).build();

        lenient().when(objectMapper.writeValueAsString(any())).thenReturn("{\"snapshot\":true}");

        // Mock security context — lenient; not all test paths reach this
        SecurityContext ctx = mock(SecurityContext.class);
        Authentication auth = mock(Authentication.class);
        lenient().when(ctx.getAuthentication()).thenReturn(auth);
        lenient().when(auth.getPrincipal()).thenReturn(mock(com.templeregistry.security.ScopeHelper.Claims.class));
        SecurityContextHolder.setContext(ctx);
    }

    @Test
    void should_submitDeclaration_when_status_is_DRAFT() {
        when(declarationRepository.findById(1L)).thenReturn(Optional.of(draftDeclaration));
        doNothing().when(ownershipGuard).assertOwnsTemple(anyLong());
        doNothing().when(stateTransitionValidator).validate(any(), any());
        when(declarationRepository.save(any())).thenReturn(draftDeclaration);
        lenient().when(userRepository.findAllByRoleAndDistrictId(any(), anyLong())).thenReturn(java.util.List.of());
        when(snapshotService.capture(any(), any())).thenReturn(null);

        declarationService.submit(1L);

        assertThat(draftDeclaration.getStatus()).isEqualTo(DeclarationStatus.SUBMITTED);
        assertThat(draftDeclaration.getSubmittedAt()).isNotNull();
    }

    @Test
    void should_approveDeclaration_and_setAcknowledgementNumber() {
        draftDeclaration.setStatus(DeclarationStatus.SUBMITTED);
        when(declarationRepository.findById(1L)).thenReturn(Optional.of(draftDeclaration));
        doNothing().when(jurisdictionGuard).assertSameDistrict(anyLong());
        doNothing().when(transitionValidator).validateDeclarationTransition(anyString(), anyString());
        when(ackGenerator.generate()).thenReturn("ACK-2024-001");
        when(declarationRepository.save(any())).thenReturn(draftDeclaration);

        declarationService.approve(1L);

        assertThat(draftDeclaration.getStatus()).isEqualTo(DeclarationStatus.APPROVED);
        assertThat(draftDeclaration.getAcknowledgementNumber()).isEqualTo("ACK-2024-001");
        assertThat(draftDeclaration.getReviewedAt()).isNotNull();
    }

    @Test
    void should_throw_EntityNotFoundException_when_declaration_not_found() {
        when(declarationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> declarationService.submit(99L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void should_requestClarification_when_status_is_SUBMITTED() {
        draftDeclaration.setStatus(DeclarationStatus.SUBMITTED);
        when(declarationRepository.findById(1L)).thenReturn(Optional.of(draftDeclaration));
        doNothing().when(jurisdictionGuard).assertSameDistrict(anyLong());
        doNothing().when(transitionValidator).validateDeclarationTransition(anyString(), anyString());
        when(declarationRepository.save(any())).thenReturn(draftDeclaration);
        when(clarificationRepository.save(any())).thenReturn(null);

        declarationService.requestClarification(1L, new ClarificationRequest("Please clarify land documents."));

        assertThat(draftDeclaration.getStatus()).isEqualTo(DeclarationStatus.CLARIFICATION_REQUIRED);
        verify(clarificationRepository).save(any());
    }

    @Test
    void should_rejectDeclaration_with_reason_logged_as_clarification() {
        draftDeclaration.setStatus(DeclarationStatus.SUBMITTED);
        when(declarationRepository.findById(1L)).thenReturn(Optional.of(draftDeclaration));
        doNothing().when(jurisdictionGuard).assertSameDistrict(anyLong());
        doNothing().when(transitionValidator).validateDeclarationTransition(anyString(), anyString());
        when(declarationRepository.save(any())).thenReturn(draftDeclaration);

        declarationService.reject(1L, new ClarificationRequest("Insufficient documentation."));

        assertThat(draftDeclaration.getStatus()).isEqualTo(DeclarationStatus.REJECTED);
        verify(clarificationRepository).save(any());
    }
}
