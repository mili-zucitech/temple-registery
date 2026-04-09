package com.templeregistry.service.impl.audit;

import com.templeregistry.entity.audit.AuditAuthEvent;
import com.templeregistry.entity.audit.AuditDataEvent;
import com.templeregistry.entity.audit.AuditExportEvent;
import com.templeregistry.repository.audit.AuditAuthEventRepository;
import com.templeregistry.repository.audit.AuditDataEventRepository;
import com.templeregistry.repository.audit.AuditExportEventRepository;
import com.templeregistry.service.audit.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditServiceImpl implements AuditService {

    private final AuditDataEventRepository dataEventRepository;
    private final AuditAuthEventRepository authEventRepository;
    private final AuditExportEventRepository exportEventRepository;

    @Override
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logDataEvent(Long actorId, String actorRole, String action,
                             String entityType, Long entityId, String detail) {
        try {
            dataEventRepository.save(AuditDataEvent.builder()
                    .actorId(actorId).actorRole(actorRole).action(action)
                    .entityType(entityType).entityId(entityId).detail(detail).build());
        } catch (Exception ex) {
            log.error("Failed to write audit data event: actor={} action={} entity={}:{}",
                    actorId, action, entityType, entityId, ex);
        }
    }

    @Override
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAuthEvent(Long userId, String username, String eventType,
                             String ipAddress, String outcome, String detail) {
        try {
            authEventRepository.save(AuditAuthEvent.builder()
                    .userId(userId).username(username).eventType(eventType)
                    .ipAddress(ipAddress).outcome(outcome).detail(detail).build());
        } catch (Exception ex) {
            log.error("Failed to write audit auth event: user={} eventType={}", username, eventType, ex);
        }
    }

    @Override
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logExportEvent(Long actorId, String actorRole, String exportType,
                               String filterSummary, int recordCount) {
        try {
            exportEventRepository.save(AuditExportEvent.builder()
                    .actorId(actorId).actorRole(actorRole).exportType(exportType)
                    .filterSummary(filterSummary).recordCount(recordCount).build());
        } catch (Exception ex) {
            log.error("Failed to write audit export event: actor={} exportType={}", actorId, exportType, ex);
        }
    }
}
