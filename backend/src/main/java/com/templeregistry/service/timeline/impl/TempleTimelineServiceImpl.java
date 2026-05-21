package com.templeregistry.service.timeline.impl;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.response.timeline.TempleTimelineEventResponse;
import com.templeregistry.entity.timeline.TempleTimelineEvent;
import com.templeregistry.entity.timeline.TimelineEventCode;
import com.templeregistry.entity.timeline.TimelineEventType;
import com.templeregistry.event.workflow.GovernanceDomainEvent;
import com.templeregistry.repository.timeline.TempleTimelineEventRepository;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.service.timeline.TempleTimelineService;
import com.templeregistry.service.timeline.TimelineEventMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class TempleTimelineServiceImpl implements TempleTimelineService {

    private static final int MAX_PAGE_SIZE = 50;

    private final TempleTimelineEventRepository repository;
    private final UserRepository userRepository;

    // ─── Write: Workflow Event ─────────────────────────────────────────────────

    @Override
    @Transactional
    public void logWorkflowEvent(GovernanceDomainEvent event) {
        if (event.templeId() == null) {
            log.debug("[Timeline] Skipping event with null templeId: action={}", event.action());
            return;
        }

        // Idempotency guard: if we already have a row for this transition, skip.
        // The UNIQUE constraint at the DB level is the true guard; this check avoids
        // relying on a constraint-violation exception for normal flow.
        Long transitionId = extractTransitionId(event);
        if (transitionId != null && repository.existsBySourceTransitionId(transitionId)) {
            log.debug("[Timeline] Duplicate workflow event skipped: transitionId={}", transitionId);
            return;
        }

        TimelineEventCode eventCode = TimelineEventMapper.resolveCode(event);
        TimelineEventMapper.EventLabels labels = TimelineEventMapper.resolveLabels(eventCode, event);

        TempleTimelineEvent row = TempleTimelineEvent.builder()
            .templeId(event.templeId())
            .eventType(TimelineEventType.WORKFLOW_TRANSITION)
            .eventCode(eventCode)
            .moduleName(event.entityType() != null ? event.entityType().name() : null)
            .title(labels.title())
            .description(labels.description())
            .referenceId(event.entityId())
            .oldStatus(event.fromStatus() != null ? event.fromStatus().name() : null)
            .newStatus(event.toStatus() != null ? event.toStatus().name() : null)
            .workflowAction(event.action() != null ? event.action().name() : null)
            .sourceTransitionId(transitionId)
            .performerId(event.actorId() != null ? event.actorId() : 0L)
            .performerName(resolvePerformerName(event.actorId()))
            .performerRole(event.actorRole() != null ? event.actorRole() : "SYSTEM")
            .createdBySystem(isSystemAction(event))
            .occurredAt(event.occurredAt() != null ? event.occurredAt() : Instant.now())
            .build();

        repository.save(row);
        log.debug("[Timeline] Logged workflow event: templeId={} code={} action={}",
            event.templeId(), eventCode, event.action());
    }

    // ─── Write: Document Event ─────────────────────────────────────────────────

    @Override
    @Transactional
    public void logDocumentEvent(
        TimelineEventCode eventCode,
        Long templeId,
        Long documentId,
        String documentLabel,
        String ownerType,
        Long performerId,
        String performerRole
    ) {
        if (templeId == null) {
            log.debug("[Timeline] Skipping document event with null templeId: docId={}", documentId);
            return;
        }

        TimelineEventType eventType = (eventCode == TimelineEventCode.DOCUMENT_UPLOADED)
            ? TimelineEventType.DOCUMENT_UPLOAD
            : TimelineEventType.DOCUMENT_DELETE;

        String title = (eventCode == TimelineEventCode.DOCUMENT_UPLOADED)
            ? "Document Uploaded"
            : "Document Removed";

        String description = buildDocumentDescription(eventCode, documentLabel, ownerType);

        TempleTimelineEvent row = TempleTimelineEvent.builder()
            .templeId(templeId)
            .eventType(eventType)
            .eventCode(eventCode)
            .moduleName("DOCUMENT")
            .entityName(documentLabel)
            .title(title)
            .description(description)
            .referenceId(documentId)
            .performerId(performerId != null ? performerId : 0L)
            .performerName(resolvePerformerName(performerId))
            .performerRole(performerRole != null ? performerRole : "UNKNOWN")
            .createdBySystem(false)
            .occurredAt(Instant.now())
            .build();

        repository.save(row);
        log.debug("[Timeline] Logged document event: templeId={} code={} docId={}",
            templeId, eventCode, documentId);
    }

    // ─── Read ─────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<TempleTimelineEventResponse> getTimeline(Long templeId, Pageable pageable) {
        // Enforce max page size to prevent large reads
        int clampedSize = Math.min(pageable.getPageSize(), MAX_PAGE_SIZE);
        Pageable clamped = PageRequest.of(pageable.getPageNumber(), clampedSize);

        Page<TempleTimelineEvent> page = repository.findByTempleIdOrderByOccurredAtDesc(templeId, clamped);
        return PaginatedResponse.of(page.map(this::toResponse));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private TempleTimelineEventResponse toResponse(TempleTimelineEvent e) {
        return new TempleTimelineEventResponse(
            e.getId(),
            e.getTempleId(),
            e.getEventType() != null ? e.getEventType().name() : null,
            e.getEventCode() != null ? e.getEventCode().name() : null,
            e.getModuleName(),
            e.getEntityName(),
            e.getTitle(),
            e.getDescription(),
            e.getMetadata(),
            e.getReferenceId(),
            e.getOldStatus(),
            e.getNewStatus(),
            e.getWorkflowAction(),
            e.getPerformerId(),
            e.getPerformerName(),
            e.getPerformerRole(),
            e.getComment(),
            e.isCreatedBySystem(),
            e.getOccurredAt()
        );
    }

    private Long extractTransitionId(GovernanceDomainEvent event) {
        // The workflow_instance_id is stored on the event; the actual transition id
        // is passed via metadata by the listener after WorkflowEngineImpl records it.
        if (event.metadata() != null) {
            Object tid = event.metadata().get("transitionId");
            if (tid instanceof Number n) {
                return n.longValue();
            }
        }
        return null;
    }

    private boolean isSystemAction(GovernanceDomainEvent event) {
        if (event.actorRole() == null) return true;
        return "SYSTEM".equalsIgnoreCase(event.actorRole());
    }

    private String resolvePerformerName(Long actorId) {
        if (actorId == null || actorId == 0L) return null;
        return userRepository.findById(actorId)
                .map(u -> u.getFullName())
                .orElse(null);
    }

    private String buildDocumentDescription(TimelineEventCode code, String label, String ownerType) {
        String docName = (label != null && !label.isBlank()) ? "\"" + label + "\"" : "a document";
        String module  = ownerType != null ? ownerType.toLowerCase() : "entity";
        if (code == TimelineEventCode.DOCUMENT_UPLOADED) {
            return "Document " + docName + " was uploaded to " + module + ".";
        }
        return "Document " + docName + " was removed from " + module + ".";
    }
}
