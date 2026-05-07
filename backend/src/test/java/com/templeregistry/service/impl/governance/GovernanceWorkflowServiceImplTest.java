package com.templeregistry.service.impl.governance;

import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.trust.Trust;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.entity.workflow.WorkflowInstance;
import com.templeregistry.entity.workflow.WorkflowStatus;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.repository.trust.TrustRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.audit.AuditService;
import com.templeregistry.service.audit.GovernanceAuditService;
import com.templeregistry.service.declaration.AcknowledgementService;
import com.templeregistry.service.temple.TempleSearchSummaryService;
import com.templeregistry.service.workflow.WorkflowEngine;
import com.templeregistry.service.workflow.WorkflowEngineAdaptor;
import com.templeregistry.service.workflow.VersionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for GovernanceWorkflowServiceImpl — focuses on:
 *   - Trust workflow methods call WorkflowEngineAdaptor correctly
 *   - sendBackTrust persists sendBackReason display field
 *   - EntityNotFoundException propagates when Trust not found
 *   - No dual-write of SubmissionStatus (removed in Canonical Status Architecture)
 */
@ExtendWith(MockitoExtension.class)
class GovernanceWorkflowServiceImplTest {

    @Mock TrustRepository trustRepository;
    @Mock TempleRepository templeRepository;
    @Mock WorkflowEngineAdaptor workflowEngineAdaptor;
    @Mock WorkflowEngine workflowEngine;
    @Mock VersionService versionService;
    @Mock JurisdictionGuard jurisdictionGuard;
    @Mock AuditService auditService;
    @Mock GovernanceAuditService governanceAuditService;
    @Mock AcknowledgementService acknowledgementService;
    @Mock TempleSearchSummaryService summaryService;
    @Mock com.templeregistry.repository.declaration.DeclarationRepository declarationRepository;
    @Mock com.templeregistry.repository.governance.PhysicalVerificationHistoryRepository physicalVerificationHistoryRepository;
    @Mock com.templeregistry.repository.workflow.WorkflowInstanceRepository workflowInstanceRepository;
    @Mock com.templeregistry.service.notification.NotificationRecipientResolver recipientResolver;
    @Mock com.templeregistry.repository.auth.UserRepository userRepository;
    @Mock com.templeregistry.service.dc.NotificationEventPublisher notificationPublisher;
    @Mock com.templeregistry.repository.declaration.DeclarationClarificationRepository clarificationRepository;
    @Mock com.templeregistry.service.clarification.ClarificationEngine clarificationEngine;
    @Mock com.templeregistry.security.OwnershipGuard ownershipGuard;
    @Mock com.templeregistry.security.ScopeHelper scopeHelper;

    @InjectMocks
    GovernanceWorkflowServiceImpl service;

    private static final Long TRUST_ID    = 1L;
    private static final Long TEMPLE_ID   = 10L;
    private static final Long DISTRICT_ID = 7L;
    private static final Long ACTOR_ID    = 5L;

    private Trust trust;
    private Temple temple;

    @BeforeEach
    void setUp() {
        trust = Trust.builder()
            .templeId(TEMPLE_ID)
            .build();
        org.springframework.test.util.ReflectionTestUtils.setField(trust, "id", TRUST_ID);

        temple = Temple.builder()
            .districtId(DISTRICT_ID)
            .build();
        org.springframework.test.util.ReflectionTestUtils.setField(temple, "id", TEMPLE_ID);

        ScopeHelper.Claims claims = new ScopeHelper.Claims(ACTOR_ID, "DISTRICT_COLLECTOR", DISTRICT_ID, null, "dc_user");
        var auth = new UsernamePasswordAuthenticationToken(claims, null);
        var secCtx = new org.springframework.security.core.context.SecurityContextImpl(auth);
        SecurityContextHolder.setContext(secCtx);

        lenient().when(trustRepository.findById(TRUST_ID)).thenReturn(Optional.of(trust));
        lenient().when(templeRepository.findById(TEMPLE_ID)).thenReturn(Optional.of(temple));
        lenient().when(templeRepository.findWithGeoById(TEMPLE_ID)).thenReturn(Optional.of(temple));
        lenient().doNothing().when(jurisdictionGuard).assertDistrictScope(any(), any());
    }

    // ── approveTrust ──────────────────────────────────────────────────────────

    @Test
    void should_callAdaptorAndSnapshot_when_approveTrust() {
        service.approveTrust(TRUST_ID);

        verify(workflowEngineAdaptor).adaptApprove(
            eq(WorkflowEntityType.TRUST), eq(TRUST_ID), eq(DISTRICT_ID), eq(ACTOR_ID));
        verify(versionService).snapshot(
            eq(WorkflowEntityType.TRUST), eq(TRUST_ID), eq(1), any(), eq(ACTOR_ID), isNull());
    }

    // ── sendBackTrust ─────────────────────────────────────────────────────────

    @Test
    void should_callAdaptorAndPersistSendBackReason_when_sendBackTrust() {
        com.templeregistry.dto.request.governance.SendBackRequest req =
            new com.templeregistry.dto.request.governance.SendBackRequest();
        req.setReason("Missing document");
        service.sendBackTrust(TRUST_ID, req);

        verify(workflowEngineAdaptor).adaptSendBack(
            eq(WorkflowEntityType.TRUST), eq(TRUST_ID), eq(DISTRICT_ID), eq(ACTOR_ID), eq("Missing document"));
        verify(trustRepository, atLeastOnce()).save(argThat(t -> "Missing document".equals(t.getSendBackReason())));
    }

    // ── rejectTrust ───────────────────────────────────────────────────────────

    @Test
    void should_callAdaptorOnly_when_rejectTrust() {
        com.templeregistry.dto.request.governance.RejectRequest req =
            new com.templeregistry.dto.request.governance.RejectRequest();
        req.setReason("Non-compliant");
        service.rejectTrust(TRUST_ID, req);

        verify(workflowEngineAdaptor).adaptReject(
            eq(WorkflowEntityType.TRUST), eq(TRUST_ID), eq(DISTRICT_ID), eq(ACTOR_ID), eq("Non-compliant"));
        // No dual-write: trustRepository.save must NOT be called for reject
        verify(trustRepository, never()).save(any());
    }

    // ── EntityNotFoundException propagates ────────────────────────────────────

    @Test
    void should_throwEntityNotFoundException_when_trustNotFound() {
        when(trustRepository.findById(TRUST_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.approveTrust(TRUST_ID))
            .isInstanceOf(EntityNotFoundException.class);
    }

    // ── No WorkflowInstance — no throw ────────────────────────────────────────

    @Test
    void should_notThrow_when_noWorkflowInstanceExistsForTrust() {
        // Trust has no WorkflowInstance yet (pre-migration record)
        // approveTrust must not throw — adaptor handles missing instances gracefully
        service.approveTrust(TRUST_ID);

        verify(workflowEngineAdaptor).adaptApprove(
            eq(WorkflowEntityType.TRUST), eq(TRUST_ID), anyLong(), eq(ACTOR_ID));
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    @SuppressWarnings("unused")
    private WorkflowInstance workflowInstanceWithStatus(WorkflowStatus status) {
        return WorkflowInstance.builder()
            .entityType(WorkflowEntityType.TRUST)
            .entityId(TRUST_ID)
            .status(status)
            .lockVersion(1L)
            .build();
    }
}

