package com.templeregistry.service.audit;

/**
 * Async, append-only audit service.
 * All methods are fire-and-forget via {@code @Async} — callers MUST NOT rely on return values or exception propagation.
 */
public interface AuditService {

    void logDataEvent(Long actorId, String actorRole, String action, String entityType, Long entityId, String detail);

    void logAuthEvent(Long userId, String username, String eventType, String ipAddress, String outcome, String detail);

    void logExportEvent(Long actorId, String actorRole, String exportType, String filterSummary, int recordCount);
}
