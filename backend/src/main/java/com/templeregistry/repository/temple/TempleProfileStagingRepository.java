package com.templeregistry.repository.temple;

import com.templeregistry.entity.temple.TempleProfileStaging;
import com.templeregistry.entity.temple.TempleProfileStagingStatus;
import com.templeregistry.entity.workflow.WorkflowStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TempleProfileStagingRepository extends JpaRepository<TempleProfileStaging, Long> {

    /** Returns all staging records for a temple ordered by most recent version first. */
    @org.springframework.data.jpa.repository.Query("SELECT s FROM TempleProfileStaging s JOIN WorkflowInstance wi ON wi.entityId = s.id AND wi.entityType = 'TEMPLE_PROFILE' WHERE s.templeId = :templeId ORDER BY wi.versionNumber DESC")
    Page<TempleProfileStaging> findAllByTempleIdOrderByVersionNumberDesc(Long templeId, Pageable pageable);

        default Optional<TempleProfileStaging> findTopByTempleIdOrderByVersionNumberDesc(Long templeId) {
                return findAllByTempleIdOrderByVersionNumberDesc(templeId, PageRequest.of(0, 1))
                                .stream()
                                .findFirst();
        }

    /** Returns the latest staging record matching any of the given statuses. */
    @org.springframework.data.jpa.repository.Query("SELECT s FROM TempleProfileStaging s JOIN WorkflowInstance wi ON wi.entityId = s.id AND wi.entityType = 'TEMPLE_PROFILE' WHERE s.templeId = :templeId AND wi.status IN :statuses ORDER BY wi.versionNumber DESC")
    Optional<TempleProfileStaging> findTopByTempleIdAndStatusInOrderByVersionNumberDesc(
            Long templeId, java.util.List<com.templeregistry.entity.workflow.WorkflowStatus> statuses);

    /** Returns the latest staging record in a specific status. */
    @org.springframework.data.jpa.repository.Query("SELECT s FROM TempleProfileStaging s JOIN WorkflowInstance wi ON wi.entityId = s.id AND wi.entityType = 'TEMPLE_PROFILE' WHERE s.templeId = :templeId AND wi.status = :status ORDER BY wi.versionNumber DESC")
    org.springframework.data.domain.Page<TempleProfileStaging> findAllByTempleIdAndStatus(
            Long templeId, com.templeregistry.entity.workflow.WorkflowStatus status, Pageable pageable);

    default Optional<TempleProfileStaging> findFirstByTempleIdAndStatus(
            Long templeId, com.templeregistry.entity.workflow.WorkflowStatus status) {
        return findAllByTempleIdAndStatus(templeId, status, PageRequest.of(0, 1))
                .stream()
                .findFirst();
    }

        default Optional<TempleProfileStaging> findFirstByTempleIdAndStatus(
                        Long templeId, TempleProfileStagingStatus status) {
                return findFirstByTempleIdAndStatus(templeId, toWorkflowStatus(status));
        }

    /**
     * Highest version number ever used for a temple.
     * Uses native SQL to include soft-deleted rows — the UNIQUE KEY
     * uk_profile_staging_temple_version (temple_id, version) applies to ALL rows
     * including soft-deleted ones, so we must account for them when computing the next version.
     */
    @org.springframework.data.jpa.repository.Query(
            value = "SELECT MAX(version) FROM temple_profile_staging WHERE temple_id = :templeId",
            nativeQuery = true)
    Optional<Integer> findMaxVersionNumberByTempleId(@org.springframework.data.repository.query.Param("templeId") Long templeId);

    @org.springframework.data.jpa.repository.Query("SELECT s FROM TempleProfileStaging s JOIN WorkflowInstance wi ON wi.entityId = s.id AND wi.entityType = 'TEMPLE_PROFILE' WHERE s.templeId = :templeId AND wi.versionNumber = :versionNumber")
    Optional<TempleProfileStaging> findByTempleIdAndVersionNumber(Long templeId, int versionNumber);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(s) > 0 FROM TempleProfileStaging s JOIN WorkflowInstance wi ON wi.entityId = s.id AND wi.entityType = 'TEMPLE_PROFILE' WHERE s.templeId = :templeId AND wi.status = :status")
    boolean existsByTempleIdAndStatus(Long templeId, com.templeregistry.entity.workflow.WorkflowStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(s) > 0 FROM TempleProfileStaging s JOIN WorkflowInstance wi ON wi.entityId = s.id AND wi.entityType = 'TEMPLE_PROFILE' WHERE s.templeId = :templeId AND wi.status IN :statuses")
    boolean existsByTempleIdAndStatusIn(Long templeId, java.util.List<com.templeregistry.entity.workflow.WorkflowStatus> statuses);

        private static WorkflowStatus toWorkflowStatus(TempleProfileStagingStatus status) {
                return switch (status) {
                        case DRAFT -> WorkflowStatus.DRAFT;
                        case PENDING_REVIEW -> WorkflowStatus.SUBMITTED;
                        case APPROVED -> WorkflowStatus.APPROVED;
                        case REJECTED -> WorkflowStatus.REJECTED;
                        case SUPERSEDED -> WorkflowStatus.SUPERSEDED;
                };
        }
}
