package com.templeregistry.service.audit;

import com.templeregistry.entity.audit.GovernanceActionHistory;
import java.util.List;

public interface GovernanceAuditService {
    void logAction(Long entityId, String entityType, Long dcUserId, String action, String comment);
    List<GovernanceActionHistory> getHistoryForEntity(String entityType, Long entityId);
}
