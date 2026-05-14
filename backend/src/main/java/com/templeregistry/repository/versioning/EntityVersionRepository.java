package com.templeregistry.repository.versioning;

import com.templeregistry.entity.versioning.EntityVersion;
import com.templeregistry.entity.versioning.EntityVersionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EntityVersionRepository extends JpaRepository<EntityVersion, Long> {

    List<EntityVersion> findByWorkflowInstanceIdOrderByVersionNumberDesc(Long workflowInstanceId);

    @Query("""
        SELECT ev FROM EntityVersion ev
        WHERE ev.workflowInstance.id = :instanceId
          AND ev.status = 'APPROVED'
          AND ev.deleted = false
        ORDER BY ev.versionNumber DESC
        LIMIT 1
        """)
    Optional<EntityVersion> findLatestApproved(@Param("instanceId") Long instanceId);

    @Query("""
        SELECT ev FROM EntityVersion ev
        WHERE ev.workflowInstance.id = :instanceId
          AND ev.status = 'DRAFT_OVERLAY'
          AND ev.deleted = false
        ORDER BY ev.versionNumber DESC
        LIMIT 1
        """)
    Optional<EntityVersion> findActiveDraftOverlay(@Param("instanceId") Long instanceId);

    @Query("""
        SELECT MAX(ev.versionNumber) FROM EntityVersion ev
        WHERE ev.workflowInstance.id = :instanceId
          AND ev.deleted = false
        """)
    Optional<Integer> findMaxVersionNumber(@Param("instanceId") Long instanceId);

    // ─── Added for VersionService (Phase B) ──────────────────────────────────

    @Query("""
        SELECT ev FROM EntityVersion ev
        WHERE ev.entityType = :entityType
          AND ev.entityId = :entityId
          AND ev.deleted = false
        ORDER BY ev.versionNumber DESC
        LIMIT 1
        """)
    Optional<EntityVersion> findTopByEntityTypeAndEntityIdOrderByVersionNumberDesc(
        @Param("entityType") String entityType,
        @Param("entityId") Long entityId
    );

    @Query("""
        SELECT ev FROM EntityVersion ev
        WHERE ev.entityType = :entityType
          AND ev.entityId = :entityId
          AND ev.versionNumber = :versionNumber
          AND ev.deleted = false
        """)
    Optional<EntityVersion> findByEntityTypeAndEntityIdAndVersionNumber(
        @Param("entityType") String entityType,
        @Param("entityId") Long entityId,
        @Param("versionNumber") int versionNumber
    );

    @Query("""
        SELECT ev FROM EntityVersion ev
        WHERE ev.entityType = :entityType
          AND ev.entityId = :entityId
          AND ev.deleted = false
        ORDER BY ev.versionNumber DESC
        """)
    List<EntityVersion> findAllByEntityTypeAndEntityIdOrderByVersionNumberDesc(
        @Param("entityType") String entityType,
        @Param("entityId") Long entityId
    );

    long countByEntityTypeAndEntityId(String entityType, Long entityId);
}

