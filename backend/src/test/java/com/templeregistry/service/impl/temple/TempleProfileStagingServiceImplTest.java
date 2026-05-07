package com.templeregistry.service.impl.temple;

import com.templeregistry.dto.request.temple.CreateTempleProfileStagingRequest;
import com.templeregistry.dto.response.temple.TempleProfileStagingResponse;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.TempleProfileStaging;
import com.templeregistry.entity.temple.TempleStatus;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.entity.workflow.WorkflowInstance;
import com.templeregistry.entity.workflow.WorkflowStatus;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.temple.TempleProfileStagingRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.OwnershipGuard;
import com.templeregistry.service.temple.TempleSearchSummaryService;
import com.templeregistry.service.workflow.ActionContextResolver;
import com.templeregistry.util.PaginationUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TempleProfileStagingServiceImplTest {

    @Mock TempleProfileStagingRepository stagingRepository;
    @Mock TempleRepository templeRepository;
    @Mock TempleSearchSummaryService summaryService;
    @Mock OwnershipGuard ownershipGuard;
    @Mock PaginationUtil paginationUtil;
    @Mock com.templeregistry.service.workflow.WorkflowEngine workflowEngine;
    @Mock com.templeregistry.service.workflow.WorkflowEngineAdaptor workflowEngineAdaptor;
    @Mock com.templeregistry.service.workflow.VersionService versionService;
    @Mock com.templeregistry.service.clarification.ClarificationEngine clarificationEngine;
    @Mock ActionContextResolver actionContextResolver;
    @Mock com.templeregistry.service.document.FileStorageService fileStorageService;
    @Mock com.templeregistry.service.governance.GovernanceStatusResolver governanceStatusResolver;

    @InjectMocks TempleProfileStagingServiceImpl stagingService;

    private Temple activeTemple;
    private Temple suspendedTemple;

    @BeforeEach
    void setUp() {
        activeTemple = Temple.builder().id(1L).districtId(10L).status(TempleStatus.ACTIVE).build();
        suspendedTemple = Temple.builder().id(1L).status(TempleStatus.SUSPENDED).build();

        lenient().doNothing().when(ownershipGuard).assertOwnsTemple(any());

        // Mock security context
        SecurityContext ctx = mock(SecurityContext.class);
        Authentication auth = mock(Authentication.class);
        var claims = mock(com.templeregistry.security.ScopeHelper.Claims.class);
        lenient().when(ctx.getAuthentication()).thenReturn(auth);
        lenient().when(auth.getPrincipal()).thenReturn(claims);
        lenient().when(claims.userId()).thenReturn(42L);
        SecurityContextHolder.setContext(ctx);

        // Standard save behavior: set ID if missing
        lenient().when(stagingRepository.save(any(TempleProfileStaging.class))).thenAnswer(invocation -> {
            TempleProfileStaging s = invocation.getArgument(0);
            if (s.getId() == null) s.setId(100L);
            return s;
        });
    }

    private WorkflowInstance mockWorkflow(WorkflowStatus status, int version) {
        WorkflowInstance instance = WorkflowInstance.builder()
                .id(999L)
                .status(status)
                .versionNumber(version)
                .lockVersion(1L)
                .submittedAt(Instant.now())
                .statusUpdatedAt(Instant.now())
                .build();
        lenient().when(workflowEngine.getState(any(), any())).thenReturn(instance);
        return instance;
    }

    @Test
    void should_throw_when_createOrUpdateDraft_called_on_SUSPENDED_temple() {
        when(templeRepository.findById(1L)).thenReturn(Optional.of(suspendedTemple));

        assertThatThrownBy(() -> stagingService.createOrUpdateDraft(1L, new CreateTempleProfileStagingRequest()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("SUSPENDED");
    }

    @Test
    void should_throw_when_submitForReview_called_on_SUBMITTED_staging_exists() {
        when(templeRepository.findById(2L)).thenReturn(Optional.of(activeTemple));
        TempleProfileStaging pending = TempleProfileStaging.builder().templeId(2L).build();
        pending.setId(101L);
        // New guard uses findTopByTempleIdAndStatusInOrderByVersionNumberDesc with list of statuses
        when(stagingRepository.findTopByTempleIdAndStatusInOrderByVersionNumberDesc(eq(2L), anyList()))
                .thenReturn(Optional.of(pending));
        WorkflowInstance instance = mockWorkflow(WorkflowStatus.SUBMITTED, 1);

        assertThatThrownBy(() -> stagingService.createOrUpdateDraft(2L, new CreateTempleProfileStagingRequest()))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void should_delegate_to_workflow_engine_when_submitForReview() {
        when(templeRepository.findById(3L)).thenReturn(Optional.of(activeTemple));
        TempleProfileStaging draft = TempleProfileStaging.builder().templeId(3L).build();
        draft.setId(102L);

        when(stagingRepository.findFirstByTempleIdAndStatus(3L, WorkflowStatus.DRAFT))
                .thenReturn(Optional.of(draft));

        WorkflowInstance instance = mockWorkflow(WorkflowStatus.DRAFT, 1);
        when(workflowEngineAdaptor.adaptSubmit(any(), any(), any(), any(), any())).thenReturn(true);

        stagingService.submitForReview(3L);

        verify(workflowEngineAdaptor).adaptSubmit(
                eq(WorkflowEntityType.TEMPLE_PROFILE), eq(102L), eq(3L), any(), any());
        verify(versionService).snapshot(eq(WorkflowEntityType.TEMPLE_PROFILE), eq(102L), eq(1), eq(draft), eq(42L), isNull());
    }

    @Test
    void should_approve_staging_and_supersede_previous_via_system_action() {
        TempleProfileStaging pendingStaging = TempleProfileStaging.builder().templeId(4L).build();
        pendingStaging.setId(200L);
        TempleProfileStaging previousApproved = TempleProfileStaging.builder().templeId(4L).build();
        previousApproved.setId(199L);

        when(stagingRepository.findById(200L)).thenReturn(Optional.of(pendingStaging));
        when(templeRepository.findById(4L)).thenReturn(Optional.of(activeTemple));
        
        // Mock current instance
        WorkflowInstance currentInstance = mockWorkflow(WorkflowStatus.SUBMITTED, 2);
        
        // Mock previous instance
        WorkflowInstance prevInstance = WorkflowInstance.builder().id(888L).status(WorkflowStatus.APPROVED).build();
        when(stagingRepository.findFirstByTempleIdAndStatus(4L, WorkflowStatus.APPROVED))
                .thenReturn(Optional.of(previousApproved));
        when(workflowEngine.getState(WorkflowEntityType.TEMPLE_PROFILE, 199L)).thenReturn(prevInstance);
        
        when(actionContextResolver.resolve(any())).thenReturn(mock(com.templeregistry.service.workflow.ActionContext.class));

        stagingService.approve(4L, 200L);

        verify(workflowEngine).executeSystem(eq(888L), eq(com.templeregistry.entity.workflow.WorkflowAction.AUTO_SUPERSEDE), anyString());
        verify(workflowEngine).execute(eq(currentInstance.getId()), any(), any());
        verify(templeRepository).save(any());
    }

    @Test
    void should_reject_staging_via_workflow_engine() {
        TempleProfileStaging pendingStaging = TempleProfileStaging.builder().templeId(5L).build();
        pendingStaging.setId(300L);
        when(stagingRepository.findById(300L)).thenReturn(Optional.of(pendingStaging));
        when(templeRepository.findById(5L)).thenReturn(Optional.of(activeTemple));
        
        WorkflowInstance instance = mockWorkflow(WorkflowStatus.SUBMITTED, 1);
        when(actionContextResolver.resolve(any())).thenReturn(mock(com.templeregistry.service.workflow.ActionContext.class));

        stagingService.reject(5L, 300L, "Fix bank details");

        verify(workflowEngine).execute(eq(instance.getId()), argThat(req -> req.getAction() == com.templeregistry.entity.workflow.WorkflowAction.REJECT), any());
    }

    // ── Parity: RESUBMITTED approve ──────────────────────────────────────────

    @Test
    void should_approve_RESUBMITTED_staging_with_canonical_APPROVE_action() {
        // Temple Profile parity: DC can approve RESUBMITTED staging (not just SUBMITTED)
        TempleProfileStaging staging = TempleProfileStaging.builder().templeId(6L).build();
        staging.setId(400L);
        when(stagingRepository.findById(400L)).thenReturn(Optional.of(staging));
        when(templeRepository.findById(6L)).thenReturn(Optional.of(activeTemple));
        when(stagingRepository.findFirstByTempleIdAndStatus(6L, WorkflowStatus.APPROVED))
                .thenReturn(Optional.empty());

        WorkflowInstance resubmittedInstance = mockWorkflow(WorkflowStatus.RESUBMITTED, 2);
        when(actionContextResolver.resolve(any())).thenReturn(mock(com.templeregistry.service.workflow.ActionContext.class));

        stagingService.approve(6L, 400L);

        // Should NOT throw — RESUBMITTED is now a valid state for approval
        verify(workflowEngine).execute(
                eq(resubmittedInstance.getId()),
                argThat(req -> req.getAction() == com.templeregistry.entity.workflow.WorkflowAction.APPROVE
                        || req.getAction() == com.templeregistry.entity.workflow.WorkflowAction.RE_APPROVE),
                any());
    }

    @Test
    void should_reject_RESUBMITTED_staging_via_workflow_engine() {
        TempleProfileStaging staging = TempleProfileStaging.builder().templeId(7L).build();
        staging.setId(500L);
        when(stagingRepository.findById(500L)).thenReturn(Optional.of(staging));
        when(templeRepository.findById(7L)).thenReturn(Optional.of(activeTemple));

        WorkflowInstance instance = mockWorkflow(WorkflowStatus.RESUBMITTED, 2);
        when(actionContextResolver.resolve(any())).thenReturn(mock(com.templeregistry.service.workflow.ActionContext.class));

        stagingService.reject(7L, 500L, "Documents missing");

        verify(workflowEngine).execute(
                eq(instance.getId()),
                argThat(req -> req.getAction() == com.templeregistry.entity.workflow.WorkflowAction.REJECT),
                any());
    }

    @Test
    void should_throw_when_approve_called_on_DRAFT_staging() {
        TempleProfileStaging staging = TempleProfileStaging.builder().templeId(8L).build();
        staging.setId(600L);
        when(stagingRepository.findById(600L)).thenReturn(Optional.of(staging));

        mockWorkflow(WorkflowStatus.DRAFT, 1);

        assertThatThrownBy(() -> stagingService.approve(8L, 600L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("DRAFT");
    }

    @Test
    void should_transition_approved_staging_to_UPDATED_AFTER_APPROVAL_on_edit() {
        // Parity: When TA edits an approved profile, the staging should transition in-place
        TempleProfileStaging approvedStaging = TempleProfileStaging.builder().templeId(9L).build();
        approvedStaging.setId(700L);

        when(templeRepository.findById(9L)).thenReturn(Optional.of(activeTemple));
        // No pending (SUBMITTED/UNDER_REVIEW/RESUBMITTED) staging
        when(stagingRepository.findTopByTempleIdAndStatusInOrderByVersionNumberDesc(eq(9L), anyList()))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(approvedStaging)); // second call: APPROVED/RE_APPROVED lookup
        // No DRAFT or UPDATED_AFTER_APPROVAL staging
        when(stagingRepository.findFirstByTempleIdAndStatus(9L, WorkflowStatus.DRAFT))
                .thenReturn(Optional.empty());
        when(stagingRepository.findFirstByTempleIdAndStatus(9L, WorkflowStatus.UPDATED_AFTER_APPROVAL))
                .thenReturn(Optional.empty());

        WorkflowInstance approvedInstance = mockWorkflow(WorkflowStatus.APPROVED, 1);
        lenient().when(workflowEngine.getState(WorkflowEntityType.TEMPLE_PROFILE, 700L)).thenReturn(approvedInstance);
        lenient().when(workflowEngine.initiate(any(), any(), any(), any(), any())).thenReturn(approvedInstance);

        stagingService.createOrUpdateDraft(9L, new CreateTempleProfileStagingRequest());

        verify(workflowEngineAdaptor).adaptEditApproved(
                eq(WorkflowEntityType.TEMPLE_PROFILE), eq(700L), anyLong(), eq(9L));
    }
}
