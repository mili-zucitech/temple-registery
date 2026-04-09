package com.templeregistry.repository.temple;

import com.templeregistry.entity.temple.TempleProfileStaging;
import com.templeregistry.entity.temple.TempleProfileStagingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TempleProfileStagingRepository extends JpaRepository<TempleProfileStaging, Long> {

    /** Returns all staging records for a temple ordered by most recent version first. */
    Page<TempleProfileStaging> findAllByTempleIdOrderByVersionNumberDesc(Long templeId, Pageable pageable);

    /** Returns the latest staging record matching any of the given statuses. */
    Optional<TempleProfileStaging> findTopByTempleIdAndStatusInOrderByVersionNumberDesc(
            Long templeId, List<TempleProfileStagingStatus> statuses);

    /** Returns the latest staging record in PENDING_REVIEW (for duplicate submit guard). */
    Optional<TempleProfileStaging> findFirstByTempleIdAndStatus(
            Long templeId, TempleProfileStagingStatus status);

    /** Highest version number ever used for a temple; 0 if no records exist. */
    Optional<TempleProfileStaging> findTopByTempleIdOrderByVersionNumberDesc(Long templeId);
}
