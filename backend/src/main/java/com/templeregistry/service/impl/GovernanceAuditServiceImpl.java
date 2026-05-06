package com.templeregistry.service.impl;

import com.templeregistry.entity.audit.GovernanceActionHistory;
import com.templeregistry.entity.workflow.WorkflowInstance;
import com.templeregistry.entity.workflow.WorkflowTransition;
import com.templeregistry.repository.audit.GovernanceActionRepository;
import com.templeregistry.service.audit.GovernanceAuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
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
    @Transactional
    public void logWorkflowTransition(WorkflowInstance instance, WorkflowTransition transition) {
        if (transition.getId() == null) {
            return;
        }
        if (governanceActionRepository.existsByWorkflowTransitionId(transition.getId())) {
            return;
        }

        GovernanceActionHistory history = GovernanceActionHistory.builder()
            .entityId(instance.getEntityId())
            .entityType(instance.getEntityType().name())
            .workflowInstanceId(instance.getId())
            .workflowTransitionId(transition.getId())
            .dcUserId(transition.getActorId() != null ? transition.getActorId() : 0L)
            .action(transition.getAction().name())
            .comment(transition.getComment())
            .actorRole(transition.getActorRole())
            .build();

        governanceActionRepository.save(history);
        log.debug("Governance audit appended for transitionId={} instanceId={} action={}",
            transition.getId(), instance.getId(), transition.getAction());
    }

    @Override
    @Transactional(readOnly = true)
    public List<GovernanceActionHistory> getHistoryForEntity(String entityType, Long entityId) {
        return governanceActionRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<GovernanceActionHistory> getAllHistory(Pageable pageable) {
        return governanceActionRepository.findAll(pageable);
    }
}
