package com.templeregistry.service.audit;

import com.templeregistry.dto.response.declaration.AuditLogEntry;

import java.util.List;

/**
 * Service for logging and querying declaration workflow audit events.
 * Backed by the governance_action_history table.
 */
public interface DeclarationAuditLogService {

    /**
     * Appends an immutable audit entry to governance_action_history.
     * Timestamp is always set to UTC server clock.
     *
     * @param declarationId the declaration being acted upon
     * @param actionType    the type of workflow action
     * @param actorId       the user performing the action
     * @param actorRole     the role of the actor
     * @param remarks       optional free-text remarks
     */
    void log(Long declarationId, AuditActionType actionType, Long actorId, String actorRole, String remarks);

    /**
     * Returns all audit entries for a declaration, ordered by timestamp ascending.
     *
     * @param declarationId the declaration to query
     * @return list of audit log entries
     */
    List<AuditLogEntry> findByDeclaration(Long declarationId);
}
