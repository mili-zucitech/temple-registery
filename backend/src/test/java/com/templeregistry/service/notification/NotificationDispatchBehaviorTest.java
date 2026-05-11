package com.templeregistry.service.notification;

import com.templeregistry.entity.notification.InAppNotification;
import com.templeregistry.entity.notification.NotificationRule;
import com.templeregistry.entity.workflow.WorkflowAction;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.entity.workflow.WorkflowStatus;
import com.templeregistry.event.base.ModuleType;
import com.templeregistry.event.workflow.GovernanceDomainEvent;
import com.templeregistry.service.notification.impl.EmailDeliveryService;
import com.templeregistry.service.notification.impl.NotificationDispatchServiceImpl;
import com.templeregistry.service.notification.impl.SseNotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Behavioral tests for NotificationDispatchServiceImpl.
 *
 * Verifies:
 *   - On APPROVE event: in-app notification row is created with correct fields
 *   - On REJECT event:  in-app notification row is created
 *   - Email is NOT enqueued when in-app-only channel configured
 *   - In-app is NOT created when user preference is disabled
 *   - Cross-user isolation: notification is created for recipient, not actor
 */
@ExtendWith(MockitoExtension.class)
class NotificationDispatchBehaviorTest {

    @Mock NotificationService notificationService;
    @Mock EmailDeliveryService emailDeliveryService;
    @Mock SseNotificationService sseService;
    @Mock NotificationPreferenceService notificationPreferenceService;
    @Mock EmailService emailService;

    @InjectMocks
    NotificationDispatchServiceImpl dispatchService;

    private static final Long ACTOR_ID     = 5L;
    private static final Long RECIPIENT_ID = 99L;
    private static final Long ENTITY_ID    = 42L;
    private static final Long INSTANCE_ID  = 10L;

    private NotificationRule inAppRule;
    private GovernanceDomainEvent approveEvent;

    @BeforeEach
    void setUp() {
        inAppRule = NotificationRule.builder()
            .templateKey("approval-notification")
            .channel("IN_APP")
            .priority("MEDIUM")
            .build();

        approveEvent = GovernanceDomainEvent.workflowTransition(
            WorkflowEntityType.DECLARATION, ENTITY_ID, INSTANCE_ID,
            WorkflowAction.APPROVE,
            WorkflowStatus.SUBMITTED, WorkflowStatus.APPROVED,
            null, null,
            ACTOR_ID, "DC",
            1L, 7L,
            "idem-key-123",
            Map.of()
        );

        // Default: in-app enabled, email disabled
        lenient().when(notificationPreferenceService.isInAppEnabled(anyLong(), any()))
            .thenReturn(true);
        lenient().when(notificationPreferenceService.isEmailEnabled(anyLong(), any()))
            .thenReturn(false);
    }

    // ── InAppNotification created on APPROVE ──────────────────────────────────

    @Test
    void should_createInAppNotification_for_recipient_when_declarationApproved() {
        dispatchService.dispatch(approveEvent, inAppRule, RECIPIENT_ID);

        verify(notificationService).createInAppNotification(
            eq(RECIPIENT_ID),
            contains("approved"),
            anyString(),
            eq("MEDIUM"),
            eq("DECLARATION"),
            anyString(),       // entityType
            eq(ENTITY_ID),     // entityId
            eq(INSTANCE_ID),   // workflowInstanceId
            any(),             // templeId
            any(),             // templeName
            any(),             // actionByName
            any(),             // actionByRole
            any(),             // redirectUrl
            any()              // workflowStatus
        );
    }

    @Test
    void should_notCreateInAppNotification_for_actor_when_declarationApproved() {
        dispatchService.dispatch(approveEvent, inAppRule, RECIPIENT_ID);

        verify(notificationService, never()).createInAppNotification(
            eq(ACTOR_ID), anyString(), anyString(), anyString(), anyString(),
            anyString(), anyLong(), anyLong(), any(), any(), any(), any(), any(), any()
        );
    }

    // ── InAppNotification created on REJECT ───────────────────────────────────

    @Test
    void should_createInAppNotification_when_declarationRejected() {
        NotificationRule rejectRule = NotificationRule.builder()
            .templateKey("rejection-notification")
            .channel("IN_APP")
            .priority("HIGH")
            .build();

        GovernanceDomainEvent rejectEvent = GovernanceDomainEvent.workflowTransition(
            WorkflowEntityType.DECLARATION, ENTITY_ID, INSTANCE_ID,
            WorkflowAction.REJECT,
            WorkflowStatus.SUBMITTED, WorkflowStatus.REJECTED,
            null, null,
            ACTOR_ID, "DC",
            1L, 7L,
            "idem-key-456",
            Map.of()
        );

        dispatchService.dispatch(rejectEvent, rejectRule, RECIPIENT_ID);

        verify(notificationService).createInAppNotification(
            eq(RECIPIENT_ID), anyString(), anyString(),
            eq("HIGH"), eq("DECLARATION"),
            anyString(),       // entityType
            eq(ENTITY_ID),     // entityId
            eq(INSTANCE_ID),   // workflowInstanceId
            any(),             // templeId
            any(),             // templeName
            any(),             // actionByName
            any(),             // actionByRole
            any(),             // redirectUrl
            any()              // workflowStatus
        );
    }

    // ── Email NOT enqueued for IN_APP-only channel ────────────────────────────

    @Test
    void should_notEnqueueEmail_when_channelIsInAppOnly() {
        dispatchService.dispatch(approveEvent, inAppRule, RECIPIENT_ID);

        verifyNoInteractions(emailDeliveryService);
    }

    // ── InApp skipped when preference disabled ────────────────────────────────

    @Test
    void should_notCreateInAppNotification_when_userPreferenceDisabled() {
        when(notificationPreferenceService.isInAppEnabled(eq(RECIPIENT_ID), any(ModuleType.class)))
            .thenReturn(false);

        dispatchService.dispatch(approveEvent, inAppRule, RECIPIENT_ID);

        verifyNoInteractions(notificationService);
        verifyNoInteractions(sseService);
    }

    // ── SSE push fires on in-app delivery ─────────────────────────────────────

    @Test
    void should_pushSseNotification_when_inAppNotificationCreated() {
        dispatchService.dispatch(approveEvent, inAppRule, RECIPIENT_ID);

        verify(sseService).push(eq(RECIPIENT_ID), anyString(), anyString());
    }
}
