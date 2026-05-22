package com.templeregistry.service.impl.accesscontrol;

import com.templeregistry.entity.accesscontrol.AccessControlAuditLog;
import com.templeregistry.entity.accesscontrol.enums.AuditChangeType;
import com.templeregistry.repository.accesscontrol.AccessControlAuditLogRepository;
import com.templeregistry.service.accesscontrol.AccessControlAuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccessControlAuditServiceImpl implements AccessControlAuditService {

    private final AccessControlAuditLogRepository auditLogRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logPolicyChange(Long policyId, AuditChangeType changeType,
                                String oldValueJson, String newValueJson,
                                Long changedByUserId, String ipAddress) {
        AccessControlAuditLog entry = AccessControlAuditLog.builder()
                .policyId(policyId)
                .changedByUserId(changedByUserId)
                .changeType(changeType)
                .oldValue(oldValueJson)
                .newValue(newValueJson)
                .changedAt(LocalDateTime.now())
                .ipAddress(ipAddress)
                .build();
        auditLogRepository.save(entry);
        log.info("DACVM audit: policy={} type={} by=userId:{}", policyId, changeType, changedByUserId);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logFieldMaskChange(Long fieldMaskId, AuditChangeType changeType,
                                   String oldValueJson, String newValueJson,
                                   Long changedByUserId, String ipAddress) {
        AccessControlAuditLog entry = AccessControlAuditLog.builder()
                .fieldMaskId(fieldMaskId)
                .changedByUserId(changedByUserId)
                .changeType(changeType)
                .oldValue(oldValueJson)
                .newValue(newValueJson)
                .changedAt(LocalDateTime.now())
                .ipAddress(ipAddress)
                .build();
        auditLogRepository.save(entry);
        log.info("DACVM audit: fieldMask={} type={} by=userId:{}", fieldMaskId, changeType, changedByUserId);
    }
}
