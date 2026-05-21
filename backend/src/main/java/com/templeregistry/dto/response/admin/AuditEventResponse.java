package com.templeregistry.dto.response.admin;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * DTO for a data mutation audit event exposed to the SUPER_ADMIN audit log.
 * Resolves actor user name and entity name at query time — no new DB columns required.
 */
@Getter
@Builder
public class AuditEventResponse {

    private Long id;

    /** Database ID of the user who performed the action. */
    private Long actorId;

    /** Human-readable full name of the actor, e.g. "Ramesh Kumar". */
    private String actorName;

    /** Role label of the actor, e.g. "DISTRICT_COLLECTOR". */
    private String actorRole;

    /** Action performed, e.g. "CREATE", "UPDATE", "APPROVE". */
    private String action;

    /** Entity type, e.g. "TRUST", "TEMPLE", "DECLARATION". */
    private String entityType;

    /** ID of the entity that was mutated. */
    private Long entityId;

    /**
     * Human-readable entity label, e.g. "Sri Rama Temple > TRUST".
     * Falls back to "ENTITY_TYPE #id" when name resolution is not available.
     */
    private String entityName;

    /** Optional detail / diff captured at mutation time. */
    private String details;

    /** Timestamp when the event occurred. */
    private LocalDateTime occurredAt;
}
