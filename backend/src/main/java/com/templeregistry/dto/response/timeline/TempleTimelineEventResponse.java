package com.templeregistry.dto.response.timeline;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

/**
 * Serializable projection of a TempleTimelineEvent for API consumers.
 *
 * The frontend maps {@code eventCode} to the display title, icon, and colour.
 * The {@code title} field is a backend-generated fallback.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record TempleTimelineEventResponse(
    Long id,
    Long templeId,

    /** Broad category: WORKFLOW_TRANSITION, DOCUMENT_UPLOAD, DOCUMENT_DELETE, SYSTEM_EVENT */
    String eventType,

    /**
     * Fine-grained code for frontend mapping, e.g. PROFILE_APPROVED.
     * Frontend uses this to pick icon, badge colour, and localised title.
     */
    String eventCode,

    /** Module context: TEMPLE_PROFILE, DECLARATION, TRUST, DOCUMENT, etc. */
    String moduleName,

    /** Name of the affected entity (document filename, declaration FY, etc.). */
    String entityName,

    /** Backend-generated human-readable title (fallback if frontend has no mapping). */
    String title,

    /** Extended description / context sentence. */
    String description,

    /** JSON metadata blob (financial year, version, etc.). */
    String metadata,

    /** PK of the referenced entity. */
    Long referenceId,

    /** Workflow status before this event. */
    String oldStatus,

    /** Workflow status after this event. */
    String newStatus,

    /** WorkflowAction that triggered this event. Null for document events. */
    String workflowAction,

    Long performerId,
    String performerName,
    String performerRole,

    String comment,
    boolean createdBySystem,
    Instant occurredAt
) {}
