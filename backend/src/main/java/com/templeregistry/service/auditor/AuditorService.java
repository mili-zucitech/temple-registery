package com.templeregistry.service.auditor;

import com.templeregistry.dto.response.auditor.AuditTrailEntry;
import com.templeregistry.dto.response.auditor.ComplianceAnomalyResponse;

import java.util.List;

public interface AuditorService {

    /**
     * Returns all temples with at least one compliance anomaly (overdue declaration,
     * no approved declaration, or no registered trust), with resolved district names.
     */
    List<ComplianceAnomalyResponse> getComplianceReport();

    /**
     * Returns a merged, time-sorted audit trail (governance actions + data events)
     * for a given entity. Manually paginated after merging the two sources.
     */
    List<AuditTrailEntry> getAuditTrail(String entityType, Long entityId, int page, int size);
}
