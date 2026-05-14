package com.templeregistry.service.timeline;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.response.timeline.TempleTimelineEventResponse;
import com.templeregistry.entity.timeline.TempleTimelineEvent;
import com.templeregistry.entity.timeline.TimelineEventCode;
import com.templeregistry.entity.timeline.TimelineEventType;
import com.templeregistry.entity.workflow.WorkflowAction;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.entity.workflow.WorkflowStatus;
import com.templeregistry.event.workflow.GovernanceDomainEvent;
import com.templeregistry.repository.timeline.TempleTimelineEventRepository;
import com.templeregistry.service.timeline.impl.TempleTimelineServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TempleTimelineServiceImplTest {

    @Mock
    TempleTimelineEventRepository repository;

    @InjectMocks
    TempleTimelineServiceImpl service;

    // ─── logWorkflowEvent ──────────────────────────────────────────────────────

    @Test
    void should_save_timeline_row_when_workflow_event_received() {
        GovernanceDomainEvent event = buildEvent(
            WorkflowEntityType.TEMPLE_PROFILE, WorkflowAction.APPROVE,
            WorkflowStatus.SUBMITTED, WorkflowStatus.APPROVED,
            1L, "DC", 10L, null
        );

        service.logWorkflowEvent(event);

        ArgumentCaptor<TempleTimelineEvent> captor = ArgumentCaptor.forClass(TempleTimelineEvent.class);
        verify(repository).save(captor.capture());
        TempleTimelineEvent saved = captor.getValue();

        assertThat(saved.getTempleId()).isEqualTo(10L);
        assertThat(saved.getEventType()).isEqualTo(TimelineEventType.WORKFLOW_TRANSITION);
        assertThat(saved.getEventCode()).isEqualTo(TimelineEventCode.PROFILE_APPROVED);
        assertThat(saved.getOldStatus()).isEqualTo("SUBMITTED");
        assertThat(saved.getNewStatus()).isEqualTo("APPROVED");
        assertThat(saved.getPerformerRole()).isEqualTo("DC");
    }

    @Test
    void should_skip_duplicate_when_source_transition_id_already_exists() {
        GovernanceDomainEvent event = buildEvent(
            WorkflowEntityType.TEMPLE_PROFILE, WorkflowAction.APPROVE,
            WorkflowStatus.SUBMITTED, WorkflowStatus.APPROVED,
            1L, "DC", 10L, 42L  // transitionId = 42
        );

        when(repository.existsBySourceTransitionId(42L)).thenReturn(true);

        service.logWorkflowEvent(event);

        verify(repository, never()).save(any());
    }

    @Test
    void should_skip_event_when_templeId_is_null() {
        GovernanceDomainEvent event = buildEvent(
            WorkflowEntityType.TEMPLE_PROFILE, WorkflowAction.SUBMIT,
            WorkflowStatus.DRAFT, WorkflowStatus.SUBMITTED,
            1L, "TA", null, null   // null templeId
        );

        service.logWorkflowEvent(event);

        verify(repository, never()).save(any());
        verify(repository, never()).existsBySourceTransitionId(any());
    }

    @Test
    void should_map_declaration_approved_to_correct_event_code() {
        GovernanceDomainEvent event = buildEvent(
            WorkflowEntityType.DECLARATION, WorkflowAction.APPROVE,
            WorkflowStatus.SUBMITTED, WorkflowStatus.APPROVED,
            2L, "DC", 10L, null
        );

        service.logWorkflowEvent(event);

        ArgumentCaptor<TempleTimelineEvent> captor = ArgumentCaptor.forClass(TempleTimelineEvent.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getEventCode()).isEqualTo(TimelineEventCode.DECLARATION_APPROVED);
    }

    @Test
    void should_map_trust_rejected_to_correct_event_code() {
        GovernanceDomainEvent event = buildEvent(
            WorkflowEntityType.TRUST, WorkflowAction.REJECT,
            WorkflowStatus.UNDER_REVIEW, WorkflowStatus.REJECTED,
            3L, "DC", 10L, null
        );

        service.logWorkflowEvent(event);

        ArgumentCaptor<TempleTimelineEvent> captor = ArgumentCaptor.forClass(TempleTimelineEvent.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getEventCode()).isEqualTo(TimelineEventCode.TRUST_REJECTED);
    }

    // ─── logDocumentEvent ─────────────────────────────────────────────────────

    @Test
    void should_save_document_upload_event() {
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.logDocumentEvent(
            TimelineEventCode.DOCUMENT_UPLOADED, 10L, 77L,
            "Trust Deed", "TRUST", 5L, "TEMPLE_AUTHORITY"
        );

        ArgumentCaptor<TempleTimelineEvent> captor = ArgumentCaptor.forClass(TempleTimelineEvent.class);
        verify(repository).save(captor.capture());
        TempleTimelineEvent saved = captor.getValue();

        assertThat(saved.getTempleId()).isEqualTo(10L);
        assertThat(saved.getEventType()).isEqualTo(TimelineEventType.DOCUMENT_UPLOAD);
        assertThat(saved.getEventCode()).isEqualTo(TimelineEventCode.DOCUMENT_UPLOADED);
        assertThat(saved.getReferenceId()).isEqualTo(77L);
        assertThat(saved.getEntityName()).isEqualTo("Trust Deed");
    }

    @Test
    void should_save_document_delete_event() {
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.logDocumentEvent(
            TimelineEventCode.DOCUMENT_DELETED, 10L, 77L,
            "Trust Deed", "TRUST", 5L, "TEMPLE_AUTHORITY"
        );

        ArgumentCaptor<TempleTimelineEvent> captor = ArgumentCaptor.forClass(TempleTimelineEvent.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getEventType()).isEqualTo(TimelineEventType.DOCUMENT_DELETE);
    }

    @Test
    void should_skip_document_event_when_templeId_is_null() {
        service.logDocumentEvent(
            TimelineEventCode.DOCUMENT_UPLOADED, null, 77L,
            "Trust Deed", "TRUST", 5L, "TEMPLE_AUTHORITY"
        );

        verify(repository, never()).save(any());
    }

    // ─── getTimeline ──────────────────────────────────────────────────────────

    @Test
    void should_return_paginated_timeline_events() {
        TempleTimelineEvent entity = TempleTimelineEvent.builder()
            .id(1L).templeId(10L)
            .eventType(TimelineEventType.WORKFLOW_TRANSITION)
            .eventCode(TimelineEventCode.PROFILE_APPROVED)
            .title("Temple Profile Approved")
            .performerId(1L).performerRole("DC")
            .occurredAt(Instant.now())
            .build();

        PageImpl<TempleTimelineEvent> page = new PageImpl<>(
            List.of(entity), PageRequest.of(0, 20), 1
        );

        when(repository.findByTempleIdOrderByOccurredAtDesc(eq(10L), any())).thenReturn(page);

        PaginatedResponse<TempleTimelineEventResponse> result =
            service.getTimeline(10L, PageRequest.of(0, 20));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).eventCode()).isEqualTo("PROFILE_APPROVED");
        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    @Test
    void should_clamp_page_size_to_max_50() {
        PageImpl<TempleTimelineEvent> emptyPage = new PageImpl<>(
            List.of(), PageRequest.of(0, 50), 0
        );
        when(repository.findByTempleIdOrderByOccurredAtDesc(eq(10L), any())).thenReturn(emptyPage);

        // Request size=200, expect clamped to 50
        service.getTimeline(10L, PageRequest.of(0, 200));

        ArgumentCaptor<org.springframework.data.domain.Pageable> pageableCaptor =
            ArgumentCaptor.forClass(org.springframework.data.domain.Pageable.class);
        verify(repository).findByTempleIdOrderByOccurredAtDesc(eq(10L), pageableCaptor.capture());
        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(50);
    }

    @Test
    void should_persist_source_transition_id_when_present_in_metadata() {
        GovernanceDomainEvent event = buildEvent(
            WorkflowEntityType.TEMPLE_PROFILE, WorkflowAction.SUBMIT,
            WorkflowStatus.DRAFT, WorkflowStatus.SUBMITTED,
            1L, "TA", 10L, 99L   // transitionId = 99 in metadata
        );

        when(repository.existsBySourceTransitionId(99L)).thenReturn(false);

        service.logWorkflowEvent(event);

        ArgumentCaptor<TempleTimelineEvent> captor = ArgumentCaptor.forClass(TempleTimelineEvent.class);
        verify(repository).save(captor.capture());
        // source_transition_id must be set — enables proper idempotency at DB level
        assertThat(captor.getValue().getSourceTransitionId()).isEqualTo(99L);
    }

    @Test
    void should_not_persist_source_transition_id_when_absent_from_metadata() {
        GovernanceDomainEvent event = buildEvent(
            WorkflowEntityType.TEMPLE_PROFILE, WorkflowAction.SUBMIT,
            WorkflowStatus.DRAFT, WorkflowStatus.SUBMITTED,
            1L, "TA", 10L, null   // no transitionId in metadata
        );

        service.logWorkflowEvent(event);

        ArgumentCaptor<TempleTimelineEvent> captor = ArgumentCaptor.forClass(TempleTimelineEvent.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getSourceTransitionId()).isNull();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private GovernanceDomainEvent buildEvent(
        WorkflowEntityType entityType, WorkflowAction action,
        WorkflowStatus from, WorkflowStatus to,
        Long entityId, String actorRole, Long templeId, Long transitionId
    ) {
        Map<String, Object> metadata = transitionId != null
            ? Map.of("transitionId", transitionId)
            : Map.of();
        return new GovernanceDomainEvent(
            "WORKFLOW_TRANSITION", entityType, entityId, 1L,
            action, from, to, null, null,
            1L, actorRole, templeId, 1L,
            Instant.now(), null, metadata
        );
    }
}
