package com.templeregistry.service.impl;

import com.templeregistry.entity.audit.GovernanceActionHistory;
import com.templeregistry.repository.audit.GovernanceActionRepository;
import com.templeregistry.service.audit.GovernanceAuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GovernanceAuditServiceImpl implements GovernanceAuditService {

    private final GovernanceActionRepository governanceActionRepository;

    @Override
    @Transactional
    public void logAction(Long entityId, String entityType, Long dcUserId, String action, String comment) {
        GovernanceActionHistory history = GovernanceActionHistory.builder()
                .entityId(entityId)
                .entityType(entityType)
                .dcUserId(dcUserId)
                .action(action)
                .comment(comment)
                .build();
        governanceActionRepository.save(history);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GovernanceActionHistory> getHistoryForEntity(String entityType, Long entityId) {
        return governanceActionRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId);
    }
}
