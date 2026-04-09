package com.templeregistry.service.impl.dc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.dto.request.dc.DcClarifyRequest;
import com.templeregistry.dto.request.dc.WorkflowApproveRequest;
import com.templeregistry.dto.request.dc.WorkflowRejectRequest;
import com.templeregistry.dto.response.dc.WorkflowActionResponse;
import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.declaration.DeclarationClarificationRepository;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.audit.AuditService;
import com.templeregistry.service.dc.NotificationEventPublisher;
import com.templeregistry.service.temple.TempleSearchSummaryService;
import com.templeregistry.util.AcknowledgementNumberGenerator;
import com.templeregistry.util.StatusTransitionValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeclarationWorkflowServiceImplTest {

    @Mock DeclarationRepository declarationRepository;
    @Mock DeclarationClarificationRepository clarificationRepository;
    @Mock TempleRepository templeRepository;
    @Mock JurisdictionGuard jurisdictionGuard;
    @Mock StatusTransitionValidator transitionValidator;
    @Mock AcknowledgementNumberGenerator ackGenerator;
    @Mock NotificationEventPublisher notificationPublisher;
    @Mock TempleSearchSummaryService summaryService;
    @Mock AuditService auditService;
    @Mock ObjectMapper objectMapper;

    @InjectMocks
    DeclarationWorkflowServiceImpl workflowService;

    private AssetDeclaration pendingDeclaration;
    private Temple temple;
    private ScopeHelper.Claims dcClaims;

    @BeforeEach
    void setUp() {
        pendingDeclaration = AssetDeclaration.builder()
                .templeId(1L)
                .districtId(10L)
                .status(DeclarationStatus.PENDING_REVIEW)
                .submittedBy(99L)
                .build();
        pendingDeclaration.setId(42L);

        temple = Temple.builder()
                .districtId(10L)
                .build();
        temple.setId(1L);

        dcClaims = new ScopeHelper.Claims(5L, RoleConstants.DISTRICT_COLLECTOR, 10L, null, "dc_user");
    }

    // ── Approve ───────────────────────────────────────────────────────────────

    @Test
    void should_approveDeclaration_and_generateAcknowledgementNumber_when_statusIsPendingReview() {
        when(declarationRepository.findByIdWithLock(42L)).thenReturn(Optional.of(pendingDeclaration));
        when(templeRepository.findWithGeoById(1L)).thenReturn(Optional.of(temple));
        doNothing().when(jurisdictionGuard).assertDistrictScope(any(), any());
        doNothing().when(transitionValidator).validateDeclarationTransition(anyString(), anyString());
        when(ackGenerator.generate()).thenReturn("ACK-2024-0042");
        when(declarationRepository.save(any())).thenReturn(pendingDeclaration);

        WorkflowApproveRequest request = new WorkflowApproveRequest();
        WorkflowActionResponse result = workflowService.approve(42L, request, dcClaims);

        assertThat(result.getNewStatus()).isEqualTo("APPROVED");
        assertThat(result.getAcknowledgementNumber()).isEqualTo("ACK-2024-0042");
        assertThat(pendingDeclaration.getStatus()).isEqualTo(DeclarationStatus.APPROVED);
        assertThat(pendingDeclaration.getReviewedAt()).isNotNull();
        verify(notificationPublisher).publish(eq(99L), eq("DECLARATION_APPROVED"), eq(42L), anyString());
        verify(summaryService).refresh(1L);
    }

    @Test
    void should_throwEntityNotFoundException_when_declarationDoesNotExist_onApprove() {
        when(declarationRepository.findByIdWithLock(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> workflowService.approve(999L, new WorkflowApproveRequest(), dcClaims))
                .isInstanceOf(EntityNotFoundException.class);

        verifyNoInteractions(summaryService, notificationPublisher);
    }

    @Test
    void should_throwEntityNotFoundException_when_templeDoesNotExist_onApprove() {
        when(declarationRepository.findByIdWithLock(42L)).thenReturn(Optional.of(pendingDeclaration));
        when(templeRepository.findWithGeoById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> workflowService.approve(42L, new WorkflowApproveRequest(), dcClaims))
                .isInstanceOf(EntityNotFoundException.class);
    }

    // ── Reject ────────────────────────────────────────────────────────────────

    @Test
    void should_rejectDeclaration_and_setStatusToRejected_when_statusIsPendingReview() {
        when(declarationRepository.findByIdWithLock(42L)).thenReturn(Optional.of(pendingDeclaration));
        when(templeRepository.findWithGeoById(1L)).thenReturn(Optional.of(temple));
        doNothing().when(jurisdictionGuard).assertDistrictScope(any(), any());
        doNothing().when(transitionValidator).validateDeclarationTransition(anyString(), anyString());
        when(declarationRepository.save(any())).thenReturn(pendingDeclaration);

        WorkflowRejectRequest request = new WorkflowRejectRequest();
        // WorkflowRejectRequest uses @Getter only; set the field via reflection for unit test
        try {
            java.lang.reflect.Field f = WorkflowRejectRequest.class.getDeclaredField("remarks");
            f.setAccessible(true);
            f.set(request, "Incomplete documentation.");
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        WorkflowActionResponse result = workflowService.reject(42L, request, dcClaims);

        assertThat(result.getNewStatus()).isEqualTo("REJECTED");
        assertThat(result.getAcknowledgementNumber()).isNull();
        assertThat(pendingDeclaration.getStatus()).isEqualTo(DeclarationStatus.REJECTED);
        verify(notificationPublisher).publish(eq(99L), eq("DECLARATION_REJECTED"), eq(42L), anyString());
        verify(summaryService).refresh(1L);
        verify(ackGenerator, never()).generate();
    }

    // ── Request Clarification ─────────────────────────────────────────────────

    @Test
    void should_requestClarification_and_incrementClarificationRound_when_statusIsPendingReview() {
        pendingDeclaration.setClarificationRound(0);
        when(declarationRepository.findByIdWithLock(42L)).thenReturn(Optional.of(pendingDeclaration));
        when(templeRepository.findWithGeoById(1L)).thenReturn(Optional.of(temple));
        doNothing().when(jurisdictionGuard).assertDistrictScope(any(), any());
        doNothing().when(transitionValidator).validateDeclarationTransition(anyString(), anyString());
        when(declarationRepository.save(any())).thenReturn(pendingDeclaration);

        DcClarifyRequest request = new DcClarifyRequest();
        // Use reflection to set private field (or use constructor if available)
        setField(request, "message", "Please provide survey deed for plot 42.");
        setField(request, "sectionName", "IMMOVABLE_LAND");

        WorkflowActionResponse result = workflowService.requestClarification(42L, request, dcClaims);

        assertThat(result.getNewStatus()).isEqualTo("CLARIFICATION_REQUESTED");
        assertThat(pendingDeclaration.getStatus()).isEqualTo(DeclarationStatus.CLARIFICATION_REQUESTED);
        assertThat(pendingDeclaration.getClarificationRound()).isEqualTo(1);
        verify(clarificationRepository).save(any());
        verify(notificationPublisher).publish(eq(99L), eq("CLARIFICATION_REQUESTED"), eq(42L), anyString());
        verify(summaryService).refresh(1L);
    }

    // ── Flag Physical Verification ────────────────────────────────────────────

    @Test
    void should_flagDeclaration_and_setPhysicalVerificationStatus_when_statusIsPendingReview() {
        when(declarationRepository.findByIdWithLock(42L)).thenReturn(Optional.of(pendingDeclaration));
        when(templeRepository.findWithGeoById(1L)).thenReturn(Optional.of(temple));
        doNothing().when(jurisdictionGuard).assertDistrictScope(any(), any());
        doNothing().when(transitionValidator).validateDeclarationTransition(anyString(), anyString());
        when(declarationRepository.save(any())).thenReturn(pendingDeclaration);

        DcClarifyRequest request = new DcClarifyRequest();
        setField(request, "message", "Physical inspection required — discrepancy in land area.");

        WorkflowActionResponse result = workflowService.flagPhysicalVerification(42L, request, dcClaims);

        assertThat(result.getNewStatus()).isEqualTo("PHYSICAL_VERIFICATION_REQUESTED");
        assertThat(pendingDeclaration.getStatus()).isEqualTo(DeclarationStatus.PHYSICAL_VERIFICATION_REQUESTED);
        verify(notificationPublisher).publish(eq(99L), eq("PHYSICAL_VERIFICATION_REQUESTED"), eq(42L), anyString());
        verify(summaryService).refresh(1L);
    }

    // ── District scope ────────────────────────────────────────────────────────

    @Test
    void should_callAssertDistrictScope_with_templeAndClaims_on_approve() {
        when(declarationRepository.findByIdWithLock(42L)).thenReturn(Optional.of(pendingDeclaration));
        when(templeRepository.findWithGeoById(1L)).thenReturn(Optional.of(temple));
        doNothing().when(jurisdictionGuard).assertDistrictScope(temple, dcClaims);
        doNothing().when(transitionValidator).validateDeclarationTransition(anyString(), anyString());
        when(ackGenerator.generate()).thenReturn("ACK-X");
        when(declarationRepository.save(any())).thenReturn(pendingDeclaration);

        workflowService.approve(42L, new WorkflowApproveRequest(), dcClaims);

        verify(jurisdictionGuard).assertDistrictScope(temple, dcClaims);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    /** Reflectively sets a private field — used for Lombok @Getter-only DTOs. */
    private static void setField(Object target, String name, Object value) {
        try {
            var field = target.getClass().getDeclaredField(name);
            field.setAccessible(true);
            field.set(target, value);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set field: " + name, e);
        }
    }
}
