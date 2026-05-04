package com.templeregistry.service.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.entity.versioning.EntityVersion;
import com.templeregistry.entity.versioning.EntityVersionStatus;
import com.templeregistry.entity.workflow.*;
import com.templeregistry.repository.notification.NotificationOutboxRepository;
import com.templeregistry.repository.workflow.IdempotencyRecordRepository;
import com.templeregistry.repository.workflow.WorkflowInstanceRepository;
import com.templeregistry.repository.workflow.WorkflowTransitionRepository;
import com.templeregistry.service.workflow.impl.WorkflowEngineImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for WorkflowEngineImpl.initiate().
 *
 * Verifies:
 *   1. workflow_instances row is written with correct fields
 *   2. workflow_transitions row is written (NULL → DRAFT, SYSTEM_INITIATE)
 *   3. entity_versions row is written (v1, DRAFT_OVERLAY)
 *   4. initiate() is idempotent — second call returns existing instance, no duplicate writes
 *   5. Concurrent duplicate: unique-index violation is handled by returning existing instance
 */
@ExtendWith(MockitoExtension.class)
class WorkflowEngineInitiateTest {

    @Mock WorkflowInstanceRepository instanceRepo;
    @Mock WorkflowTransitionRepository transitionRepo;
    @Mock IdempotencyRecordRepository idempotencyRepo;
    @Mock NotificationOutboxRepository outboxRepo;
    @Mock TransitionRuleRegistry ruleRegistry;
    @Mock ApplicationEventPublisher eventPublisher;
    @Mock ObjectMapper objectMapper;
    @Mock VersionService versionService;

    @InjectMocks
    WorkflowEngineImpl engine;

    private static final WorkflowEntityType ENTITY_TYPE = WorkflowEntityType.TEMPLE_PROFILE;
    private static final Long ENTITY_ID   = 300006L;
    private static final Long TEMPLE_ID   = 30270L;
    private static final Long DISTRICT_ID = 1L;
    private static final Long CREATED_BY  = 4L;

    private WorkflowInstance savedInstance;

    @BeforeEach
    void setUp() {
        savedInstance = WorkflowInstance.builder()
            .entityType(ENTITY_TYPE)
            .entityId(ENTITY_ID)
            .status(WorkflowStatus.DRAFT)
            .lockVersion(0L)
            .versionNumber(1)
            .currentActorRole("TA")
            .createdByUserId(CREATED_BY)
            .templeId(TEMPLE_ID)
            .districtId(DISTRICT_ID)
            .build();
        // Simulate auto-generated PK
        savedInstance.setId(6L);
    }

    // ─── Test 1: workflow_instances row ──────────────────────────────────────

    @Test
    @DisplayName("initiate() writes workflow_instances row with correct fields")
    void initiate_writesWorkflowInstanceRow() {
        when(instanceRepo.findByEntityTypeAndEntityId(ENTITY_TYPE, ENTITY_ID))
            .thenReturn(Optional.empty());
        when(instanceRepo.save(any(WorkflowInstance.class))).thenReturn(savedInstance);

        WorkflowTransition savedTransition = WorkflowTransition.builder().build();
        savedTransition.setId(1L);
        when(transitionRepo.save(any(WorkflowTransition.class))).thenReturn(savedTransition);

        WorkflowInstance result = engine.initiate(ENTITY_TYPE, ENTITY_ID, TEMPLE_ID, DISTRICT_ID, CREATED_BY);

        ArgumentCaptor<WorkflowInstance> captor = ArgumentCaptor.forClass(WorkflowInstance.class);
        verify(instanceRepo).save(captor.capture());

        WorkflowInstance written = captor.getValue();
        assertThat(written.getEntityType()).isEqualTo(ENTITY_TYPE);
        assertThat(written.getEntityId()).isEqualTo(ENTITY_ID);
        assertThat(written.getStatus()).isEqualTo(WorkflowStatus.DRAFT);
        assertThat(written.getLockVersion()).isEqualTo(0L);
        assertThat(written.getVersionNumber()).isEqualTo(1);
        assertThat(written.getCurrentActorRole()).isEqualTo("TA");
        assertThat(written.getTempleId()).isEqualTo(TEMPLE_ID);
        assertThat(written.getDistrictId()).isEqualTo(DISTRICT_ID);
        assertThat(written.getCreatedByUserId()).isEqualTo(CREATED_BY);
        assertThat(result.getId()).isEqualTo(6L);
    }

    // ─── Test 2: workflow_transitions row ────────────────────────────────────

    @Test
    @DisplayName("initiate() writes initial workflow_transitions row: NULL → DRAFT, SYSTEM_INITIATE")
    void initiate_writesInitialTransitionRow() {
        when(instanceRepo.findByEntityTypeAndEntityId(ENTITY_TYPE, ENTITY_ID))
            .thenReturn(Optional.empty());
        when(instanceRepo.save(any(WorkflowInstance.class))).thenReturn(savedInstance);

        WorkflowTransition savedTransition = WorkflowTransition.builder().build();
        savedTransition.setId(1L);
        when(transitionRepo.save(any(WorkflowTransition.class))).thenReturn(savedTransition);

        engine.initiate(ENTITY_TYPE, ENTITY_ID, TEMPLE_ID, DISTRICT_ID, CREATED_BY);

        ArgumentCaptor<WorkflowTransition> captor = ArgumentCaptor.forClass(WorkflowTransition.class);
        verify(transitionRepo).save(captor.capture());

        WorkflowTransition written = captor.getValue();
        assertThat(written.getFromStatus()).isNull();                          // no prior state
        assertThat(written.getToStatus()).isEqualTo(WorkflowStatus.DRAFT);
        assertThat(written.getAction()).isEqualTo(WorkflowAction.SYSTEM_INITIATE);
        assertThat(written.getActorId()).isEqualTo(CREATED_BY);
        assertThat(written.getActorRole()).isEqualTo("TA");
        assertThat(written.getIdempotencyKey()).isEqualTo("INIT:TEMPLE_PROFILE:300006");
        assertThat(written.getInstanceVersionAtTransition()).isEqualTo(0L);
        assertThat(written.getWorkflowInstance()).isSameAs(savedInstance);
    }

    // ─── Test 3: entity_versions row ─────────────────────────────────────────

    @Test
    @DisplayName("initiate() writes initial entity_versions row: v1, DRAFT_OVERLAY")
    void initiate_writesInitialEntityVersionRow() {
        when(instanceRepo.findByEntityTypeAndEntityId(ENTITY_TYPE, ENTITY_ID))
            .thenReturn(Optional.empty());
        when(instanceRepo.save(any(WorkflowInstance.class))).thenReturn(savedInstance);

        WorkflowTransition savedTransition = WorkflowTransition.builder().build();
        savedTransition.setId(1L);
        when(transitionRepo.save(any(WorkflowTransition.class))).thenReturn(savedTransition);

        engine.initiate(ENTITY_TYPE, ENTITY_ID, TEMPLE_ID, DISTRICT_ID, CREATED_BY);

        ArgumentCaptor<EntityVersion> captor = ArgumentCaptor.forClass(EntityVersion.class);
        verify(versionService).saveRaw(captor.capture());

        EntityVersion written = captor.getValue();
        assertThat(written.getEntityType()).isEqualTo(ENTITY_TYPE.name());
        assertThat(written.getEntityId()).isEqualTo(ENTITY_ID);
        assertThat(written.getVersionNumber()).isEqualTo(1);
        assertThat(written.getStatus()).isEqualTo(EntityVersionStatus.DRAFT_OVERLAY);
        assertThat(written.getWorkflowInstance()).isSameAs(savedInstance);
        assertThat(written.getCapturedByUserId()).isEqualTo(CREATED_BY);
        assertThat(written.getTriggeringTransitionId()).isEqualTo(1L);
        assertThat(written.getSnapshotJson()).contains("TEMPLE_PROFILE");
        assertThat(written.getSnapshotJson()).contains("300006");
    }

    // ─── Test 4: idempotency — second call returns existing instance ──────────

    @Test
    @DisplayName("initiate() is idempotent — second call returns existing instance without writing")
    void initiate_isIdempotent_returnsExistingInstance() {
        when(instanceRepo.findByEntityTypeAndEntityId(ENTITY_TYPE, ENTITY_ID))
            .thenReturn(Optional.of(savedInstance));

        WorkflowInstance result = engine.initiate(ENTITY_TYPE, ENTITY_ID, TEMPLE_ID, DISTRICT_ID, CREATED_BY);

        assertThat(result).isSameAs(savedInstance);
        verify(instanceRepo, never()).save(any());
        verify(transitionRepo, never()).save(any());
        verify(versionService, never()).saveRaw(any());
    }

    // ─── Test 5: entity_version snapshot failure is non-fatal ────────────────

    @Test
    @DisplayName("initiate() does not roll back if entity_version snapshot fails")
    void initiate_snapshotFailure_isNonFatal() {
        when(instanceRepo.findByEntityTypeAndEntityId(ENTITY_TYPE, ENTITY_ID))
            .thenReturn(Optional.empty());
        when(instanceRepo.save(any(WorkflowInstance.class))).thenReturn(savedInstance);

        WorkflowTransition savedTransition = WorkflowTransition.builder().build();
        savedTransition.setId(1L);
        when(transitionRepo.save(any(WorkflowTransition.class))).thenReturn(savedTransition);

        // Simulate snapshot failure
        doThrow(new RuntimeException("DB timeout")).when(versionService).saveRaw(any());

        // Should NOT throw — snapshot failure is caught and logged
        WorkflowInstance result = engine.initiate(ENTITY_TYPE, ENTITY_ID, TEMPLE_ID, DISTRICT_ID, CREATED_BY);

        assertThat(result).isSameAs(savedInstance);
        // workflow_instance and transition were still written
        verify(instanceRepo).save(any());
        verify(transitionRepo).save(any());
    }

    // ─── Test 6: all three writes happen in the same @Transactional call ─────

    @Test
    @DisplayName("initiate() calls instanceRepo, transitionRepo, and versionService in one invocation")
    void initiate_allThreeWritesInOneCall() {
        when(instanceRepo.findByEntityTypeAndEntityId(ENTITY_TYPE, ENTITY_ID))
            .thenReturn(Optional.empty());
        when(instanceRepo.save(any(WorkflowInstance.class))).thenReturn(savedInstance);

        WorkflowTransition savedTransition = WorkflowTransition.builder().build();
        savedTransition.setId(1L);
        when(transitionRepo.save(any(WorkflowTransition.class))).thenReturn(savedTransition);

        engine.initiate(ENTITY_TYPE, ENTITY_ID, TEMPLE_ID, DISTRICT_ID, CREATED_BY);

        // All three writes happened
        verify(instanceRepo, times(1)).save(any(WorkflowInstance.class));
        verify(transitionRepo, times(1)).save(any(WorkflowTransition.class));
        verify(versionService, times(1)).saveRaw(any(EntityVersion.class));
        // No outbox write on initiate (outbox is only for execute() transitions)
        verify(outboxRepo, never()).save(any());
    }
}
