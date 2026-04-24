package com.templeregistry.service.impl.audit;

import com.templeregistry.dto.response.declaration.AuditLogEntry;
import com.templeregistry.entity.audit.GovernanceActionHistory;
import com.templeregistry.repository.audit.GovernanceActionRepository;
import com.templeregistry.service.audit.AuditActionType;
import com.templeregistry.service.audit.DeclarationAuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Implementation of DeclarationAuditLogService backed by GovernanceActionHistory entity.
 * All timestamps are set to UTC server clock.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DeclarationAuditLogServiceImpl implements DeclarationAuditLogService {

    private final GovernanceActionRepository governanceActionRepository;

    @Override
    @Transactional
    public void log(Long declarationId, AuditActionType actionType, Long actorId, String actorRole, String remarks) {
        GovernanceActionHistory entry = GovernanceActionHistory.builder()
                .entityId(declarationId)
                .entityType("DECLARATION")
                .dcUserId(actorId != null ? actorId : 0L)
                .action(actionType.name())
                .comment(remarks)
                .actorRole(actorRole)
                .build();
        governanceActionRepository.save(entry);
        log.debug("Audit log: declarationId={} action={} actorId={} role={}",
                declarationId, actionType, actorId, actorRole);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogEntry> findByDeclaration(Long declarationId) {
        return governanceActionRepository
                .findByEntityTypeAndEntityIdOrderByTimestampAsc("DECLARATION", declarationId)
                .stream()
                .map(h -> new AuditLogEntry(
                        h.getId(),
                        h.getEntityId(),
                        h.getAction(),
                        h.getDcUserId(),
                        h.getActorRole(),
                        h.getTimestamp(),
                        h.getComment()
                ))
                .toList();
    }
}
