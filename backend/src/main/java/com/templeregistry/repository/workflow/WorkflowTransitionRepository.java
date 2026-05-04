package com.templeregistry.repository.workflow;

import com.templeregistry.entity.workflow.WorkflowTransition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkflowTransitionRepository extends JpaRepository<WorkflowTransition, Long> {

    @Query("""
        SELECT wt FROM WorkflowTransition wt
        WHERE wt.workflowInstance.id = :instanceId
          AND wt.deleted = false
        ORDER BY wt.performedAt ASC
        """)
    List<WorkflowTransition> findAllByInstanceIdOrderByPerformedAt(@Param("instanceId") Long instanceId);

    @Query("""
        SELECT wt FROM WorkflowTransition wt
        WHERE wt.workflowInstance.id = :instanceId
          AND wt.deleted = false
        ORDER BY wt.performedAt DESC
        LIMIT 1
        """)
    java.util.Optional<WorkflowTransition> findLatestByInstanceId(@Param("instanceId") Long instanceId);

    /** Used by WorkflowController.getWorkflowHistory() */
    @Query("""
        SELECT wt FROM WorkflowTransition wt
        WHERE wt.workflowInstance.id = :instanceId
          AND wt.deleted = false
        ORDER BY wt.performedAt DESC
        """)
    List<WorkflowTransition> findHistoryByInstanceId(@Param("instanceId") Long instanceId);

    /** Count transitions for SLA audit */
    long countByWorkflowInstanceId(Long workflowInstanceId);

    /** Used by WorkflowHistoryService.getHistory() */
    @Query("""
        SELECT wt FROM WorkflowTransition wt
        WHERE wt.workflowInstance.id = :instanceId
          AND wt.deleted = false
        ORDER BY wt.performedAt ASC
        """)
    List<WorkflowTransition> findByWorkflowInstanceIdOrderByPerformedAtAsc(@Param("instanceId") Long instanceId);

    /** Used by WorkflowHistoryService.getHistorySummary() */
    @Query("""
        SELECT wt FROM WorkflowTransition wt
        WHERE wt.workflowInstance.id = :instanceId
          AND wt.deleted = false
        ORDER BY wt.performedAt DESC
        """)
    List<WorkflowTransition> findByWorkflowInstanceIdOrderByPerformedAtDesc(@Param("instanceId") Long instanceId);
}

