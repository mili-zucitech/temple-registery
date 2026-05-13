package com.templeregistry.event.timeline;

import com.templeregistry.entity.workflow.WorkflowAction;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.entity.workflow.WorkflowStatus;
import com.templeregistry.event.workflow.GovernanceDomainEvent;
import com.templeregistry.service.timeline.TempleTimelineService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GovernanceDomainEventTimelineListenerTest {

    @Mock
    TempleTimelineService templeTimelineService;

    @InjectMocks
    GovernanceDomainEventTimelineListener listener;

    @Test
    void should_delegate_to_service_when_templeId_is_present() {
        GovernanceDomainEvent event = approveEvent(10L);

        listener.onGovernanceDomainEvent(event);

        verify(templeTimelineService).logWorkflowEvent(event);
    }

    @Test
    void should_skip_when_templeId_is_null() {
        GovernanceDomainEvent event = approveEvent(null);

        listener.onGovernanceDomainEvent(event);

        verify(templeTimelineService, never()).logWorkflowEvent(any());
    }

    @Test
    void should_swallow_service_exception_and_not_propagate() {
        GovernanceDomainEvent event = approveEvent(10L);
        doThrow(new RuntimeException("DB error")).when(templeTimelineService).logWorkflowEvent(any());

        // Must not throw — timeline failures are non-fatal
        listener.onGovernanceDomainEvent(event);
    }

    @Test
    void should_handle_reject_event() {
        GovernanceDomainEvent event = new GovernanceDomainEvent(
            "WORKFLOW_TRANSITION", WorkflowEntityType.DECLARATION, 5L, 2L,
            WorkflowAction.REJECT, WorkflowStatus.UNDER_REVIEW, WorkflowStatus.REJECTED,
            null, null, 1L, "DC", 10L, 1L,
            Instant.now(), null, Map.of()
        );

        listener.onGovernanceDomainEvent(event);

        verify(templeTimelineService).logWorkflowEvent(event);
    }

    @Test
    void should_handle_submit_event_for_trust() {
        GovernanceDomainEvent event = new GovernanceDomainEvent(
            "WORKFLOW_TRANSITION", WorkflowEntityType.TRUST, 3L, 4L,
            WorkflowAction.SUBMIT, WorkflowStatus.DRAFT, WorkflowStatus.SUBMITTED,
            null, null, 2L, "TA", 10L, 1L,
            Instant.now(), null, Map.of()
        );

        listener.onGovernanceDomainEvent(event);

        verify(templeTimelineService).logWorkflowEvent(event);
    }

    private GovernanceDomainEvent approveEvent(Long templeId) {
        return new GovernanceDomainEvent(
            "WORKFLOW_TRANSITION", WorkflowEntityType.TEMPLE_PROFILE, 1L, 1L,
            WorkflowAction.APPROVE, WorkflowStatus.SUBMITTED, WorkflowStatus.APPROVED,
            null, null, 1L, "DC", templeId, 1L,
            Instant.now(), null, Map.of()
        );
    }
}
