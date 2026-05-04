package com.templeregistry.service.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.entity.workflow.*;
import com.templeregistry.exception.WorkflowException;
import com.templeregistry.repository.notification.NotificationOutboxRepository;
import com.templeregistry.repository.workflow.IdempotencyRecordRepository;
import com.templeregistry.repository.workflow.WorkflowInstanceRepository;
import com.templeregistry.repository.workflow.WorkflowTransitionRepository;
import com.templeregistry.service.audit.GovernanceAuditService;
import com.templeregistry.service.workflow.impl.WorkflowEngineImpl;
import jakarta.persistence.OptimisticLockException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for WorkflowEngineImpl.execute().
 *
 * Verifies the canonical 13-step pipeline:
 *   - APPROVE from SUBMITTED → APPROVED writes transition row + outbox row
 *   - REJECT from SUBMITTED → REJECTED (terminal)
 *   - SEND_BACK from SUBMITTED → CLARIFICATION_REQUESTED
 *   - Idempotency key collision returns cached result without re-processing
 *   - Expected-version mismatch throws OptimisticLockException
 *   - Missing transition rule throws WorkflowException
 *   - Jurisdiction mismatch (wrong district) throws WorkflowException
 */
@ExtendWith(MockitoExtension.class)
class WorkflowEngineExecuteTest {

    @Mock WorkflowInstanceRepository instanceRepo;
    @Mock WorkflowTransitionRepository transitionRepo;
    @Mock IdempotencyRecordRepository idempotencyRepo;
    @Mock NotificationOutboxRepository outboxRepo;
    @Mock TransitionRuleRegistry ruleRegistry;
    @Mock ApplicationEventPublisher eventPublisher;
    @Mock ObjectMapper objectMapper;
    @Mock VersionService versionService;
    @Mock GovernanceAuditService governanceAuditService;

    /**
     * Policies are an empty list — policy evaluation is tested separately.
     * Must be a @Spy so Mockito injects it as an empty List (not null) into
     * the @RequiredArgsConstructor-generated constructor of WorkflowEngineImpl.
     */
    @Spy
    List<WorkflowPolicy> policies = new java.util.ArrayList<>();

    @InjectMocks
    WorkflowEngineImpl engine;

    private static final Long INSTANCE_ID = 10L;
    private static final Long DISTRICT_ID = 7L;
    private static final Long TEMPLE_ID   = 42L;
    private static final Long ACTOR_ID    = 5L;

    private WorkflowInstance submittedInstance;
    private ActionContext dcContext;

    @BeforeEach
    void setUp() {
        submittedInstance = WorkflowInstance.builder()
            .entityType(WorkflowEntityType.DECLARATION)
            .entityId(100L)
            .status(WorkflowStatus.SUBMITTED)
            .lockVersion(0L)
            .versionNumber(1)
            .currentActorRole("TA")
            .districtId(DISTRICT_ID)
            .templeId(TEMPLE_ID)
            .build();
        submittedInstance.setId(INSTANCE_ID);

        dcContext = ActionContext.builder()
            .actorId(ACTOR_ID)
            .actorRole("DC")
            .actorDistrictId(DISTRICT_ID)
            .build();

        // Idempotency: no cached record by default
        lenient().when(idempotencyRepo.findByIdempotencyKey(anyString()))
            .thenReturn(Optional.empty());

        // Instance load by default returns our submitted instance
        lenient().when(instanceRepo.findById(INSTANCE_ID))
            .thenReturn(Optional.of(submittedInstance));

        // Save returns same instance (simulate @Version bump)
        lenient().when(instanceRepo.save(any())).thenAnswer(inv -> {
            WorkflowInstance i = inv.getArgument(0);
            i.setLockVersion(i.getLockVersion() + 1);
            return i;
        });

        WorkflowTransition savedTransition = WorkflowTransition.builder().build();
        savedTransition.setId(99L);
        lenient().when(transitionRepo.save(any())).thenReturn(savedTransition);
        lenient().when(outboxRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    // ── APPROVE ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("execute() APPROVE — transitions SUBMITTED → APPROVED and writes transition + outbox rows")
    void should_transitionToApproved_and_writeTransitionAndOutbox_when_dcApprovesSubmittedDeclaration() {
        TransitionRule approveRule = approveRule();
        when(ruleRegistry.find("DECLARATION", WorkflowStatus.SUBMITTED, WorkflowAction.APPROVE))
            .thenReturn(Optional.of(approveRule));

        WorkflowActionRequest request = WorkflowActionRequest.builder()
            .action(WorkflowAction.APPROVE)
            .idempotencyKey(UUID.randomUUID().toString())
            .build();

        WorkflowTransitionResult result = engine.execute(INSTANCE_ID, request, dcContext);

        assertThat(submittedInstance.getStatus()).isEqualTo(WorkflowStatus.APPROVED);
        assertThat(result.getNewStatus()).isEqualTo(WorkflowStatus.APPROVED);

        ArgumentCaptor<WorkflowTransition> transitionCaptor = ArgumentCaptor.forClass(WorkflowTransition.class);
        verify(transitionRepo).save(transitionCaptor.capture());
        WorkflowTransition recorded = transitionCaptor.getValue();
        assertThat(recorded.getFromStatus()).isEqualTo(WorkflowStatus.SUBMITTED);
        assertThat(recorded.getToStatus()).isEqualTo(WorkflowStatus.APPROVED);
        assertThat(recorded.getAction()).isEqualTo(WorkflowAction.APPROVE);
        assertThat(recorded.getActorId()).isEqualTo(ACTOR_ID);

        verify(outboxRepo).save(any());
        verify(eventPublisher).publishEvent(any(Object.class));
    }

    // ── REJECT ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("execute() REJECT — transitions SUBMITTED → REJECTED (terminal)")
    void should_transitionToRejected_when_dcRejectsSubmittedDeclaration() {
        TransitionRule rejectRule = rule(WorkflowStatus.SUBMITTED, WorkflowAction.REJECT, WorkflowStatus.REJECTED);
        when(ruleRegistry.find("DECLARATION", WorkflowStatus.SUBMITTED, WorkflowAction.REJECT))
            .thenReturn(Optional.of(rejectRule));

        WorkflowActionRequest request = WorkflowActionRequest.builder()
            .action(WorkflowAction.REJECT)
            .comment("Incorrect land records.")
            .idempotencyKey(UUID.randomUUID().toString())
            .build();

        engine.execute(INSTANCE_ID, request, dcContext);

        assertThat(submittedInstance.getStatus()).isEqualTo(WorkflowStatus.REJECTED);
    }

    // ── SEND_BACK ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("execute() SEND_BACK — transitions SUBMITTED → CLARIFICATION_REQUESTED, not REJECTED")
    void should_transitionToClarificationRequested_not_Rejected_when_sendBackUsed() {
        TransitionRule sendBackRule = rule(WorkflowStatus.SUBMITTED, WorkflowAction.SEND_BACK,
            WorkflowStatus.CLARIFICATION_REQUESTED);
        when(ruleRegistry.find("DECLARATION", WorkflowStatus.SUBMITTED, WorkflowAction.SEND_BACK))
            .thenReturn(Optional.of(sendBackRule));

        WorkflowActionRequest request = WorkflowActionRequest.builder()
            .action(WorkflowAction.SEND_BACK)
            .comment("Please provide survey deed.")
            .idempotencyKey(UUID.randomUUID().toString())
            .build();

        engine.execute(INSTANCE_ID, request, dcContext);

        assertThat(submittedInstance.getStatus()).isEqualTo(WorkflowStatus.CLARIFICATION_REQUESTED);
        assertThat(submittedInstance.getStatus()).isNotEqualTo(WorkflowStatus.REJECTED);
    }

    // ── Idempotency collision ─────────────────────────────────────────────────

    @Test
    @DisplayName("execute() idempotency — returns cached result without re-processing when key already used")
    void should_returnCachedResult_and_skipProcessing_when_idempotencyKeyAlreadyUsed() throws Exception {
        String key = UUID.randomUUID().toString();
        String cachedJson = "{\"newStatus\":\"APPROVED\",\"availableActions\":[]}";

        com.templeregistry.entity.workflow.IdempotencyRecord cached =
            com.templeregistry.entity.workflow.IdempotencyRecord.builder()
                .idempotencyKey(key)
                .resultStatus("SUCCESS")
                .resultJson(cachedJson)
                .build();
        when(idempotencyRepo.findByIdempotencyKey(key)).thenReturn(Optional.of(cached));

        WorkflowTransitionResult expectedResult = WorkflowTransitionResult.builder()
            .newStatus(WorkflowStatus.APPROVED)
            .availableActions(List.of())
            .build();
        when(objectMapper.readValue(cachedJson, WorkflowTransitionResult.class))
            .thenReturn(expectedResult);

        WorkflowActionRequest request = WorkflowActionRequest.builder()
            .action(WorkflowAction.APPROVE)
            .idempotencyKey(key)
            .build();

        WorkflowTransitionResult result = engine.execute(INSTANCE_ID, request, dcContext);

        assertThat(result.getNewStatus()).isEqualTo(WorkflowStatus.APPROVED);
        // No state change — instance never loaded, no transition written, no outbox row
        verify(instanceRepo, never()).findById(anyLong());
        verify(transitionRepo, never()).save(any());
        verify(outboxRepo, never()).save(any());
    }

    // ── Expected version mismatch ─────────────────────────────────────────────

    @Test
    @DisplayName("execute() expectedVersion mismatch — throws OptimisticLockException")
    void should_throwOptimisticLockException_when_expectedVersionDoesNotMatch() {
        TransitionRule approveRule = approveRule();
        when(ruleRegistry.find("DECLARATION", WorkflowStatus.SUBMITTED, WorkflowAction.APPROVE))
            .thenReturn(Optional.of(approveRule));

        WorkflowActionRequest request = WorkflowActionRequest.builder()
            .action(WorkflowAction.APPROVE)
            .expectedVersion(99L)   // actual is 0L
            .idempotencyKey(UUID.randomUUID().toString())
            .build();

        assertThatThrownBy(() -> engine.execute(INSTANCE_ID, request, dcContext))
            .isInstanceOf(OptimisticLockException.class);

        verify(instanceRepo, never()).save(any());
        verify(transitionRepo, never()).save(any());
    }

    // ── Missing transition rule ───────────────────────────────────────────────

    @Test
    @DisplayName("execute() no matching rule — throws WorkflowException")
    void should_throwWorkflowException_when_noTransitionRuleExists() {
        when(ruleRegistry.find(anyString(), any(), any())).thenReturn(Optional.empty());

        WorkflowActionRequest request = WorkflowActionRequest.builder()
            .action(WorkflowAction.APPROVE)
            .idempotencyKey(UUID.randomUUID().toString())
            .build();

        assertThatThrownBy(() -> engine.execute(INSTANCE_ID, request, dcContext))
            .isInstanceOf(WorkflowException.class)
            .hasMessageContaining("No transition rule");

        verify(instanceRepo, never()).save(any());
    }

    // ── Jurisdiction mismatch ─────────────────────────────────────────────────

    @Test
    @DisplayName("execute() DC wrong district — throws WorkflowException")
    void should_throwWorkflowException_when_dcDistrictDoesNotMatchInstanceDistrict() {
        TransitionRule approveRule = approveRule();
        when(ruleRegistry.find("DECLARATION", WorkflowStatus.SUBMITTED, WorkflowAction.APPROVE))
            .thenReturn(Optional.of(approveRule));

        ActionContext wrongDistrict = ActionContext.builder()
            .actorId(ACTOR_ID)
            .actorRole("DC")
            .actorDistrictId(999L)   // different from instance.districtId = 7
            .build();

        WorkflowActionRequest request = WorkflowActionRequest.builder()
            .action(WorkflowAction.APPROVE)
            .idempotencyKey(UUID.randomUUID().toString())
            .build();

        assertThatThrownBy(() -> engine.execute(INSTANCE_ID, request, wrongDistrict))
            .isInstanceOf(WorkflowException.class)
            .hasMessageContaining("district");

        verify(instanceRepo, never()).save(any());
    }

    // ── Idempotency record written on success ─────────────────────────────────

    @Test
    @DisplayName("execute() idempotency write — saves IdempotencyRecord to repo after successful transition")
    void should_saveIdempotencyRecord_when_transitionSucceedsWithIdempotencyKey() {
        TransitionRule approveRule = approveRule();
        when(ruleRegistry.find("DECLARATION", WorkflowStatus.SUBMITTED, WorkflowAction.APPROVE))
            .thenReturn(Optional.of(approveRule));

        String key = UUID.randomUUID().toString();
        WorkflowActionRequest request = WorkflowActionRequest.builder()
            .action(WorkflowAction.APPROVE)
            .idempotencyKey(key)
            .build();

        engine.execute(INSTANCE_ID, request, dcContext);

        // Verify idempotencyRepo.save() was called with a record carrying the correct key and SUCCESS status
        ArgumentCaptor<com.templeregistry.entity.workflow.IdempotencyRecord> captor =
            ArgumentCaptor.forClass(com.templeregistry.entity.workflow.IdempotencyRecord.class);
        verify(idempotencyRepo).save(captor.capture());
        com.templeregistry.entity.workflow.IdempotencyRecord saved = captor.getValue();
        assertThat(saved.getIdempotencyKey()).isEqualTo(key);
        assertThat(saved.getResultStatus()).isEqualTo("SUCCESS");
        assertThat(saved.getWorkflowInstanceId()).isEqualTo(INSTANCE_ID);
        assertThat(saved.getAction()).isEqualTo(WorkflowAction.APPROVE);
        assertThat(saved.getActorUserId()).isEqualTo(ACTOR_ID);
        assertThat(saved.getExpiresAt()).isNotNull();
    }

    @Test
    @DisplayName("execute() idempotency write — skipped when no idempotency key supplied")
    void should_notSaveIdempotencyRecord_when_noIdempotencyKeySupplied() {
        TransitionRule approveRule = approveRule();
        when(ruleRegistry.find("DECLARATION", WorkflowStatus.SUBMITTED, WorkflowAction.APPROVE))
            .thenReturn(Optional.of(approveRule));

        WorkflowActionRequest request = WorkflowActionRequest.builder()
            .action(WorkflowAction.APPROVE)
            // no idempotencyKey
            .build();

        engine.execute(INSTANCE_ID, request, dcContext);

        verify(idempotencyRepo, never()).save(any());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private TransitionRule approveRule() {
        return rule(WorkflowStatus.SUBMITTED, WorkflowAction.APPROVE, WorkflowStatus.APPROVED);
    }

    private TransitionRule rule(WorkflowStatus from, WorkflowAction action, WorkflowStatus to) {
        return TransitionRule.builder()
            .entityType("DECLARATION")
            .fromStatus(from)
            .action(action)
            .requiredRole("DC")
            .toStatus(to)
            .clearSubStatus(true)
            .build();
    }
}
