package com.templeregistry.service.accesscontrol;

import com.templeregistry.entity.accesscontrol.enums.AuditChangeType;

/**
 * Records immutable change events for DACVM policy and field-mask mutations.
 */
public interface AccessControlAuditService {

    void logPolicyChange(Long policyId, AuditChangeType changeType,
                         String oldValueJson, String newValueJson,
                         Long changedByUserId, String ipAddress);

    void logFieldMaskChange(Long fieldMaskId, AuditChangeType changeType,
                            String oldValueJson, String newValueJson,
                            Long changedByUserId, String ipAddress);
}
