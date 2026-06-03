package com.templeregistry.service.timeline;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.response.timeline.TempleTimelineEventResponse;
import com.templeregistry.entity.timeline.TimelineEventCode;
import com.templeregistry.event.workflow.GovernanceDomainEvent;
import org.springframework.data.domain.Pageable;

/**
 * Service for managing the temple timeline / audit trail.
 *
 * IMPORTANT: This is a secondary system. Failures in any method here
 * MUST be caught by callers and never propagated to the primary workflow.
 */
public interface TempleTimelineService {

    /**
     * Record a workflow transition event in the timeline.
     *
     * Called by the GovernanceDomainEvent listener (AFTER_COMMIT).
     * Idempotent: duplicate source_transition_id is silently skipped.
     *
     * @param event the domain event emitted by WorkflowEngineImpl
     */
    void logWorkflowEvent(GovernanceDomainEvent event);

    /**
     * Record a document-lifecycle event (upload or soft-delete).
     *
     * @param eventCode       DOCUMENT_UPLOADED or DOCUMENT_DELETED
     * @param templeId        owning temple
     * @param documentId      PK of the affected document
     * @param documentLabel   human-readable label for the document
     * @param ownerType       TEMPLE, TRUST, DECLARATION, etc.
     * @param performerId     user who triggered the action
     * @param performerRole   role of the actor
     */
    void logDocumentEvent(
        TimelineEventCode eventCode,
        Long templeId,
        Long documentId,
        String documentLabel,
        String ownerType,
        Long performerId,
        String performerRole
    );

    /**
     * Paginated read of timeline events for a temple, latest first.
     *
     * @param templeId  the temple whose timeline to retrieve
     * @param pageable  page + size (max 50 enforced in implementation)
     * @return paginated response of timeline events
     */
    PaginatedResponse<TempleTimelineEventResponse> getTimeline(Long templeId, Pageable pageable);
}
