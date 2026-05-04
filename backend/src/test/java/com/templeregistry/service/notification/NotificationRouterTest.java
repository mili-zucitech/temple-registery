package com.templeregistry.service.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.entity.notification.NotificationOutbox;
import com.templeregistry.entity.notification.NotificationRule;
import com.templeregistry.entity.workflow.WorkflowAction;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.entity.workflow.WorkflowStatus;
import com.templeregistry.event.workflow.GovernanceDomainEvent;
import com.templeregistry.repository.notification.NotificationOutboxRepository;
import com.templeregistry.repository.notification.NotificationRuleRepository;
import com.templeregistry.service.notification.impl.NotificationDeduplicationGuard;
import com.templeregistry.service.notification.impl.NotificationDispatchServiceImpl;
import com.templeregistry.service.notification.impl.NotificationRouter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for NotificationRouter — covers the core routing logic in route().
 *
 * Verifies:
 *   - When a matching rule exists and recipient resolves → dispatch called once
 *   - When no matching rule → dispatch never called
 *   - When dedup guard returns isDuplicate → dispatch skipped
 *   - When multiple recipients → dispatch called for each
 *   - dispatchPending marks outbox row as DISPATCHED on success
 *   - dispatchPending marks outbox row as FAILED and increments retryCount on exception
 *   - retryFailed max retries sets status to FAILED
 */
@ExtendWith(MockitoExtension.class)
class NotificationRouterTest {

    @Mock NotificationOutboxRepository outboxRepo;
    @Mock NotificationRuleRepository ruleRepo;
    @Mock NotificationRecipientResolver recipientResolver;
    @Mock NotificationDispatchServiceImpl dispatchService;
    @Mock NotificationDeduplicationGuard deduplicationGuard;
    @Mock ObjectMapper objectMapper;

    @InjectMocks
    NotificationRouter router;

    private static final Long ENTITY_ID   = 42L;
    private static final Long INSTANCE_ID = 10L;
    private static final Long ACTOR_ID    = 5L;
    private static final Long DISTRICT_ID = 7L;
    private static final Long TEMPLE_ID   = 3L;
    private static final Long RECIPIENT_A = 99L;
    private static final Long RECIPIENT_B = 100L;

    private GovernanceDomainEvent approveEvent;
    private NotificationRule inAppRule;

    @BeforeEach
    void setUp() {
        approveEvent = GovernanceDomainEvent.workflowTransition(
            WorkflowEntityType.DECLARATION, ENTITY_ID, INSTANCE_ID,
            WorkflowAction.APPROVE,
            WorkflowStatus.SUBMITTED, WorkflowStatus.APPROVED,
            null, null,
            ACTOR_ID, "DC",
            TEMPLE_ID, DISTRICT_ID,
            "idem-key-router-001",
            Map.of()
        );

        inAppRule = NotificationRule.builder()
            .templateKey("approval-notification")
            .channel("IN_APP")
            .priority("MEDIUM")
            .recipientType("DC")
            .build();
    }

    // ── route(): dispatch called when rule + recipient present ────────────────

    @Test
    void should_dispatchOnce_when_singleMatchingRuleAndSingleRecipient() {
        when(ruleRepo.findMatchingRules(anyString(), anyString(), anyString()))
            .thenReturn(List.of(inAppRule));
        when(recipientResolver.getDistrictCollectorIds(DISTRICT_ID))
            .thenReturn(new Long[]{RECIPIENT_A});
        when(deduplicationGuard.isDuplicate(anyString())).thenReturn(false);

        router.route(approveEvent);

        verify(dispatchService).dispatch(eq(approveEvent), eq(inAppRule), eq(RECIPIENT_A));
        verify(deduplicationGuard).markSeen(anyString());
    }

    @Test
    void should_dispatchForEachRecipient_when_multipleRecipientsResolved() {
        when(ruleRepo.findMatchingRules(anyString(), anyString(), anyString()))
            .thenReturn(List.of(inAppRule));
        when(recipientResolver.getDistrictCollectorIds(DISTRICT_ID))
            .thenReturn(new Long[]{RECIPIENT_A, RECIPIENT_B});
        when(deduplicationGuard.isDuplicate(anyString())).thenReturn(false);

        router.route(approveEvent);

        verify(dispatchService).dispatch(eq(approveEvent), eq(inAppRule), eq(RECIPIENT_A));
        verify(dispatchService).dispatch(eq(approveEvent), eq(inAppRule), eq(RECIPIENT_B));
    }

    // ── route(): no dispatch when no matching rule ────────────────────────────

    @Test
    void should_notDispatch_when_noMatchingRulesFound() {
        when(ruleRepo.findMatchingRules(anyString(), anyString(), anyString()))
            .thenReturn(List.of());

        router.route(approveEvent);

        verifyNoInteractions(dispatchService);
    }

    // ── route(): dedup guard suppresses dispatch ───────────────────────────────

    @Test
    void should_notDispatch_when_deduplicationGuardReturnsDuplicate() {
        when(ruleRepo.findMatchingRules(anyString(), anyString(), anyString()))
            .thenReturn(List.of(inAppRule));
        when(recipientResolver.getDistrictCollectorIds(DISTRICT_ID))
            .thenReturn(new Long[]{RECIPIENT_A});
        when(deduplicationGuard.isDuplicate(anyString())).thenReturn(true);

        router.route(approveEvent);

        verifyNoInteractions(dispatchService);
        verify(deduplicationGuard, never()).markSeen(anyString());
    }

    // ── dispatchPending: outbox DISPATCHED on success ─────────────────────────

    @Test
    void should_markOutboxDispatched_when_routingSucceeds() throws Exception {
        NotificationOutbox outbox = NotificationOutbox.builder()
            .eventPayloadJson("{}")
            .dispatchStatus("PENDING")
            .retryCount(0)
            .build();

        when(outboxRepo.findPendingBatch(50)).thenReturn(List.of(outbox));
        when(objectMapper.readValue("{}", GovernanceDomainEvent.class)).thenReturn(approveEvent);
        when(ruleRepo.findMatchingRules(anyString(), anyString(), anyString()))
            .thenReturn(List.of());   // no rules → route completes without dispatch

        router.dispatchPending();

        assertThat(outbox.getDispatchStatus()).isEqualTo("DISPATCHED");
        assertThat(outbox.getDispatchedAt()).isNotNull();
        verify(outboxRepo).save(outbox);
    }

    // ── dispatchPending: outbox FAILED on exception ───────────────────────────

    @Test
    void should_markOutboxFailed_and_incrementRetryCount_when_routingThrows() throws Exception {
        NotificationOutbox outbox = NotificationOutbox.builder()
            .eventPayloadJson("bad-json")
            .dispatchStatus("PENDING")
            .retryCount(0)
            .build();

        when(outboxRepo.findPendingBatch(50)).thenReturn(List.of(outbox));
        when(objectMapper.readValue("bad-json", GovernanceDomainEvent.class))
            .thenThrow(new RuntimeException("parse error"));

        router.dispatchPending();

        assertThat(outbox.getDispatchStatus()).isEqualTo("FAILED");
        assertThat(outbox.getRetryCount()).isEqualTo(1);
        assertThat(outbox.getLastError()).contains("parse error");
        verify(outboxRepo).save(outbox);
    }

    // ── retryFailed: caps status at FAILED after max retries ──────────────────

    @Test
    void should_setStatusFailed_when_retryCountReachesMaximum() throws Exception {
        NotificationOutbox outbox = NotificationOutbox.builder()
            .eventPayloadJson("bad-json")
            .dispatchStatus("FAILED")
            .retryCount(2)   // one more attempt will exceed limit of 3
            .build();

        when(outboxRepo.findRetryableBatch(20)).thenReturn(List.of(outbox));
        when(objectMapper.readValue("bad-json", GovernanceDomainEvent.class))
            .thenThrow(new RuntimeException("parse error"));

        router.retryFailed();

        assertThat(outbox.getRetryCount()).isEqualTo(3);
        assertThat(outbox.getDispatchStatus()).isEqualTo("FAILED");
    }
}
