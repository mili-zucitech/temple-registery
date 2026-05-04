package com.templeregistry.repository.audit;

import com.templeregistry.entity.audit.GovernanceActionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GovernanceActionRepository extends JpaRepository<GovernanceActionHistory, Long> {
    List<GovernanceActionHistory> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, Long entityId);
    List<GovernanceActionHistory> findByEntityTypeAndEntityIdOrderByTimestampAsc(String entityType, Long entityId);
    boolean existsByWorkflowTransitionId(Long workflowTransitionId);
}
