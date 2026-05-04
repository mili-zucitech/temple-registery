package com.templeregistry.repository.workflow;

import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.entity.workflow.WorkflowInstance;
import com.templeregistry.entity.workflow.WorkflowStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowInstanceRepository extends JpaRepository<WorkflowInstance, Long> {

    Optional<WorkflowInstance> findByEntityTypeAndEntityId(WorkflowEntityType entityType, Long entityId);

    boolean existsByEntityTypeAndEntityId(WorkflowEntityType entityType, Long entityId);

    // ─── Dashboard / List queries ─────────────────────────────────────────────

    @Query("""
        SELECT wi FROM WorkflowInstance wi
        WHERE wi.districtId = :districtId
          AND wi.status IN :statuses
          AND wi.deleted = false
        ORDER BY wi.statusUpdatedAt DESC
        """)
    Page<WorkflowInstance> findByDistrictAndStatuses(
        @Param("districtId") Long districtId,
        @Param("statuses") List<WorkflowStatus> statuses,
        Pageable pageable
    );

    @Query("""
        SELECT wi FROM WorkflowInstance wi
        WHERE wi.districtId = :districtId
          AND wi.entityType IN :entityTypes
          AND wi.status IN :statuses
          AND wi.deleted = false
        ORDER BY wi.statusUpdatedAt DESC
        """)
    Page<WorkflowInstance> findByDistrictEntityTypesAndStatuses(
        @Param("districtId") Long districtId,
        @Param("entityTypes") List<WorkflowEntityType> entityTypes,
        @Param("statuses") List<WorkflowStatus> statuses,
        Pageable pageable
    );

    @Query("""
        SELECT wi FROM WorkflowInstance wi
        WHERE wi.templeId = :templeId
          AND wi.deleted = false
        ORDER BY wi.statusUpdatedAt DESC
        """)
    List<WorkflowInstance> findAllByTempleId(@Param("templeId") Long templeId);

    @Query("""
        SELECT wi FROM WorkflowInstance wi
        WHERE wi.templeId = :templeId
          AND wi.entityType = :entityType
          AND wi.deleted = false
        ORDER BY wi.versionNumber DESC
        """)
    List<WorkflowInstance> findByTempleIdAndEntityType(
        @Param("templeId") Long templeId,
        @Param("entityType") WorkflowEntityType entityType
    );

    // ─── Count queries for badges ─────────────────────────────────────────────

    long countByDistrictIdAndStatusIn(Long districtId, List<WorkflowStatus> statuses);

    long countByTempleIdAndStatusIn(Long templeId, List<WorkflowStatus> statuses);

    // ─── Scheduler queries ────────────────────────────────────────────────────

    @Query("""
        SELECT wi FROM WorkflowInstance wi
        WHERE wi.status IN :statuses
          AND wi.deadlineAt IS NOT NULL
          AND wi.deadlineAt < :now
          AND (wi.subStatus IS NULL OR wi.subStatus != 'FLAG_OVERDUE')
          AND wi.deleted = false
        ORDER BY wi.deadlineAt ASC
        """)
    List<WorkflowInstance> findOverdueInstances(
        @Param("statuses") List<WorkflowStatus> statuses,
        @Param("now") java.time.Instant now
    );

    @Query("""
        SELECT wi FROM WorkflowInstance wi
        WHERE wi.status IN :statuses
          AND wi.deadlineAt IS NOT NULL
          AND wi.deadlineAt > :now
          AND wi.deadlineAt < :warningThreshold
          AND (wi.subStatus IS NULL OR wi.subStatus != 'DEADLINE_WARNING_SENT')
          AND wi.deleted = false
        """)
    List<WorkflowInstance> findApproachingDeadlineInstances(
        @Param("statuses") List<WorkflowStatus> statuses,
        @Param("now") java.time.Instant now,
        @Param("warningThreshold") java.time.Instant warningThreshold
    );
}

