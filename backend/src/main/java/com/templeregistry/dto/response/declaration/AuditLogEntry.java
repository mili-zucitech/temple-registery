package com.templeregistry.dto.response.declaration;

import java.time.LocalDateTime;

/**
 * Immutable audit log entry for a declaration workflow action.
 */
public record AuditLogEntry(
    Long id,
    Long declarationId,
    String actionType,
    Long actorId,
    String actorRole,
    LocalDateTime timestamp,
    String remarks
) {}
