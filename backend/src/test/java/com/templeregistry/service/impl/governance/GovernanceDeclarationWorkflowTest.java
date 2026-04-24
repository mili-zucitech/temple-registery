package com.templeregistry.service.impl.governance;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.dto.request.dc.DcClarifyRequest;
import com.templeregistry.dto.request.dc.WorkflowApproveRequest;
import com.templeregistry.dto.request.dc.WorkflowRejectRequest;
import com.templeregistry.dto.response.dc.WorkflowActionResponse;
import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.entity.governance.PhysicalVerificationStatus;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.exception.ClarificationLimitExceededException;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.exception.IllegalStatusTransitionException;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.declaration.DeclarationClarificationRepository;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.governance.PhysicalVerificationHistoryRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.repository.trust.TrustRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.OwnershipGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.audit.AuditService;
import com.templeregistry.service.audit.GovernanceAuditService;
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

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for GovernanceWorkflowServiceImpl — declaration workflow actions.
 *
 * Verifies that GovernanceWorkflowServiceImpl is the SINGLE SOURCE OF TRUTH
 * for all declaration workflow transitions (approve, reject, clarify,
 * flag-physical, under-review).
 */
@ExtendWith(MockitoExtension.class)
class GovernanceDeclarationWorkflowTest {

    @Mock DeclarationRepository declarationRepository;
    @Mock DeclarationClarificationRepository clarificationRepository;
    @Mock TempleRepository templeRepository;
    @Mock TrustRepository trustRepository;
    @Mock PhysicalVerificationHistoryRepository physicalVerificationHistoryRepository;
    @Mock JurisdictionGuard jurisdictionGuard;
    @Mock OwnershipGuard ownershipGuard;
    @Mock StatusTransitionValidator transitionValidator;
    @Mock AcknowledgementNumberGenerator ackGenerator;
    @Mock NotificationEventPublisher notificationPublisher;
    @Mock TempleSearchSummaryService summaryService;
    @Mock AuditService auditService;
    @Mock GovernanceAuditService governanceAuditService;
    @Mock ObjectMapper objectMapper;
    @Mock UserRepository userRepository;
    @Mock com.templeregistry.service.declaration.StateTransitionValidator stateTransitionValidator;
    @Mock com.templeregistry.service.declaration.SnapshotService snapshotService;
    @Mock com.templeregistry.service.audit.DeclarationAuditLogService declarationAuditLogService;
    @Mock com.templeregistry.service.declaration.AcknowledgementService acknowledgementService;

    @InjectMocks
    GovernanceWorkflowServiceImpl workflowService;

    private AssetDeclaration pendingDeclaration;
    private Temple temple;
    private ScopeHelper.Claims dcClaims;

    @BeforeEach
    void setUp() {
        pendingDeclaration = AssetDeclaration.builder()
                .templeId(1L)
                .districtId(10L)
                .status(DeclarationStatus.SUBMITTED)
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
        doNothing().when(stateTransitionValidator).validate(any(), any());
        lenient().when(acknowledgementService.generate(any(), any())).thenReturn("ACK-2024-0042");
        when(declarationRepository.save(any())).thenReturn(pendingDeclaration);

        WorkflowApproveRequest request = new WorkflowApproveRequest();
        WorkflowActionResponse result = workflowService.approveDeclaration(42L, request, dcClaims);

        assertThat(result.getNewStatus()).isEqualTo("APPROVED");
        assertThat(result.getAcknowledgementNumber()).isEqualTo("ACK-2024-0042");
        assertThat(pendingDeclaration.getStatus()).isEqualTo(DeclarationStatus.APPROVED);
        assertThat(pendingDeclaration.getReviewedAt()).isNotNull();
        verify(notificationPublisher).publish(eq(99L), eq("DECLARATION_APPROVED"), eq(42L), anyString());
        verify(summaryService).refresh(1L);
    }

    @Test
    void should_blockApproval_when_physicalVerificationFailed() {
        pendingDeclaration.setPhysicalVerificationStatus(PhysicalVerificationStatus.VERIFICATION_FAILED);
        when(declarationRepository.findByIdWithLock(42L)).thenReturn(Optional.of(pendingDeclaration));
        when(templeRepository.findWithGeoById(1L)).thenReturn(Optional.of(temple));
        doNothing().when(jurisdictionGuard).assertDistrictScope(any(), any());
        doNothing().when(stateTransitionValidator).validate(any(), any());

        assertThatThrownBy(() -> workflowService.approveDeclaration(42L, new WorkflowApproveRequest(), dcClaims))
                .isInstanceOf(IllegalStatusTransitionException.class)
                .hasMessageContaining("physical verification has FAILED");

        verify(declarationRepository, never()).save(any());
        verifyNoInteractions(summaryService, notificationPublisher);
    }

    @Test
    void should_throwEntityNotFoundException_when_declarationDoesNotExist_onApprove() {
        when(declarationRepository.findByIdWithLock(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> workflowService.approveDeclaration(999L, new WorkflowApproveRequest(), dcClaims))
                .isInstanceOf(EntityNotFoundException.class);

        verifyNoInteractions(summaryService, notificationPublisher);
    }

    // ── Reject ────────────────────────────────────────────────────────────────

    @Test
    void should_rejectDeclaration_and_setStatusToRejected_when_statusIsPendingReview() {
        when(declarationRepository.findByIdWithLock(42L)).thenReturn(Optional.of(pendingDeclaration));
        when(templeRepository.findWithGeoById(1L)).thenReturn(Optional.of(temple));
        doNothing().when(jurisdictionGuard).assertDistrictScope(any(), any());
        doNothing().when(stateTransitionValidator).validate(any(), any());
        when(declarationRepository.save(any())).thenReturn(pendingDeclaration);

        WorkflowRejectRequest request = new WorkflowRejectRequest();
        setField(request, "remarks", "Incomplete documentation.");

        WorkflowActionResponse result = workflowService.rejectDeclaration(42L, request, dcClaims);

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
        doNothing().when(stateTransitionValidator).validate(any(), any());
        when(declarationRepository.save(any())).thenReturn(pendingDeclaration);

        DcClarifyRequest request = new DcClarifyRequest();
        setField(request, "message", "Please provide survey deed for plot 42.");
        setField(request, "sectionName", "IMMOVABLE_LAND");

        WorkflowActionResponse result = workflowService.requestClarification(42L, request, dcClaims);

        assertThat(result.getNewStatus()).isEqualTo("CLARIFICATION_REQUIRED");
        assertThat(pendingDeclaration.getStatus()).isEqualTo(DeclarationStatus.CLARIFICATION_REQUIRED);
        assertThat(pendingDeclaration.getClarificationRound()).isEqualTo(1);
        verify(clarificationRepository).save(any());
        verify(notificationPublisher).publish(eq(99L), eq("CLARIFICATION_REQUESTED"), eq(42L), anyString());
        verify(summaryService).refresh(1L);
    }

    @Test
    void should_throwClarificationLimitExceeded_when_roundAlreadyAtMax() {
        pendingDeclaration.setClarificationRound(3);
        when(declarationRepository.findByIdWithLock(42L)).thenReturn(Optional.of(pendingDeclaration));
        when(templeRepository.findWithGeoById(1L)).thenReturn(Optional.of(temple));
        doNothing().when(jurisdictionGuard).assertDistrictScope(any(), any());

        DcClarifyRequest request = new DcClarifyRequest();
        setField(request, "message", "Need more info.");

        assertThatThrownBy(() -> workflowService.requestClarification(42L, request, dcClaims))
                .isInstanceOf(ClarificationLimitExceededException.class);

        verifyNoInteractions(clarificationRepository, notificationPublisher, summaryService);
    }

    @Test
    void should_notifySuperAdmins_when_clarificationRoundReachesTwo() {
        pendingDeclaration.setClarificationRound(1);
        when(declarationRepository.findByIdWithLock(42L)).thenReturn(Optional.of(pendingDeclaration));
        when(templeRepository.findWithGeoById(1L)).thenReturn(Optional.of(temple));
        doNothing().when(jurisdictionGuard).assertDistrictScope(any(), any());
        doNothing().when(stateTransitionValidator).validate(any(), any());
        when(declarationRepository.save(any())).thenReturn(pendingDeclaration);
        User sa1 = User.builder().role(UserRole.SUPER_ADMIN).username("sa1").build();
        sa1.setId(1000L);
        User sa2 = User.builder().role(UserRole.SUPER_ADMIN).username("sa2").build();
        sa2.setId(1001L);
        when(userRepository.findAllByRole(UserRole.SUPER_ADMIN)).thenReturn(List.of(sa1, sa2));

        DcClarifyRequest request = new DcClarifyRequest();
        setField(request, "message", "Round 2 request.");
        setField(request, "sectionName", "IMMOVABLE_LAND");

        workflowService.requestClarification(42L, request, dcClaims);

        verify(notificationPublisher).publish(eq(1000L), eq("CLARIFICATION_ESCALATION"), eq(42L), eq("ASSET_DECLARATION"));
        verify(notificationPublisher).publish(eq(1001L), eq("CLARIFICATION_ESCALATION"), eq(42L), eq("ASSET_DECLARATION"));
    }

    // ── Mark Under Review ─────────────────────────────────────────────────────

    @Test
    void should_markDeclarationUnderReview_when_statusIsPendingReview() {
        when(declarationRepository.findByIdWithLock(42L)).thenReturn(Optional.of(pendingDeclaration));
        when(templeRepository.findWithGeoById(1L)).thenReturn(Optional.of(temple));
        doNothing().when(jurisdictionGuard).assertDistrictScope(any(), any());
        doNothing().when(stateTransitionValidator).validate(any(), any());
        when(declarationRepository.save(any())).thenReturn(pendingDeclaration);

        WorkflowActionResponse result = workflowService.markUnderReview(42L, dcClaims);

        assertThat(result.getNewStatus()).isEqualTo("UNDER_REVIEW");
        assertThat(pendingDeclaration.getStatus()).isEqualTo(DeclarationStatus.UNDER_REVIEW);
    }

    // ── Flag Physical Verification ────────────────────────────────────────────

    @Test
    void should_flagDeclaration_for_physicalVerification_when_statusIsPendingReview() {
        when(declarationRepository.findByIdWithLock(42L)).thenReturn(Optional.of(pendingDeclaration));
        when(templeRepository.findWithGeoById(1L)).thenReturn(Optional.of(temple));
        doNothing().when(jurisdictionGuard).assertDistrictScope(any(), any());
        doNothing().when(stateTransitionValidator).validate(any(), any());
        when(declarationRepository.save(any())).thenReturn(pendingDeclaration);

        DcClarifyRequest request = new DcClarifyRequest();
        setField(request, "message", "Physical inspection required — discrepancy in land area.");

        WorkflowActionResponse result = workflowService.flagPhysicalVerification(42L, request, dcClaims);

        assertThat(result.getNewStatus()).isEqualTo("SITE_VISIT_SCHEDULED");
        assertThat(pendingDeclaration.getStatus()).isEqualTo(DeclarationStatus.SITE_VISIT_SCHEDULED);
        verify(notificationPublisher).publish(eq(99L), eq("PHYSICAL_VERIFICATION_REQUESTED"), eq(42L), anyString());
        verify(summaryService).refresh(1L);
    }

    // ── District scope ────────────────────────────────────────────────────────

    @Test
    void should_callAssertDistrictScope_with_templeAndClaims_on_approve() {
        when(declarationRepository.findByIdWithLock(42L)).thenReturn(Optional.of(pendingDeclaration));
        when(templeRepository.findWithGeoById(1L)).thenReturn(Optional.of(temple));
        doNothing().when(jurisdictionGuard).assertDistrictScope(temple, dcClaims);
        doNothing().when(stateTransitionValidator).validate(any(), any());
        lenient().when(acknowledgementService.generate(any(), any())).thenReturn("ACK-X");
        when(declarationRepository.save(any())).thenReturn(pendingDeclaration);

        workflowService.approveDeclaration(42L, new WorkflowApproveRequest(), dcClaims);

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
