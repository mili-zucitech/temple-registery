package com.templeregistry.repository.clarification;

import com.templeregistry.entity.clarification.ClarificationThread;
import com.templeregistry.entity.clarification.ClarificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClarificationThreadRepository extends JpaRepository<ClarificationThread, Long> {

    List<ClarificationThread> findByWorkflowInstanceIdOrderByRoundNumberAsc(Long workflowInstanceId);

    @Query("""
        SELECT ct FROM ClarificationThread ct
        WHERE ct.workflowInstance.id = :instanceId
          AND ct.status IN ('OPEN', 'RESPONDED')
          AND ct.deleted = false
        ORDER BY ct.roundNumber DESC
        """)
    List<ClarificationThread> findActiveByWorkflowInstanceId(@Param("instanceId") Long instanceId);

    @Query("""
        SELECT ct FROM ClarificationThread ct
        WHERE ct.workflowInstance.id = :instanceId
          AND ct.deleted = false
        ORDER BY ct.roundNumber DESC
        LIMIT 1
        """)
    Optional<ClarificationThread> findLatestByWorkflowInstanceId(@Param("instanceId") Long instanceId);

    @Query("""
        SELECT COUNT(ct) FROM ClarificationThread ct
        WHERE ct.workflowInstance.id = :instanceId
          AND ct.deleted = false
        """)
    int countRoundsByWorkflowInstanceId(@Param("instanceId") Long instanceId);

    @Query("""
        SELECT MAX(ct.roundNumber) FROM ClarificationThread ct
        WHERE ct.workflowInstance.id = :instanceId
          AND ct.deleted = false
        """)
    Optional<Integer> findMaxRoundNumber(@Param("instanceId") Long instanceId);
}
