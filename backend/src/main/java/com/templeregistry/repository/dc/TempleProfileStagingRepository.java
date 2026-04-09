package com.templeregistry.repository.dc;

import com.templeregistry.entity.dc.TempleProfileStaging;
import com.templeregistry.entity.dc.ProfileStagingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TempleProfileStagingRepository extends JpaRepository<TempleProfileStaging, Long> {

    /**
     * Find the latest pending submission for a temple.
     * At most one row should have PENDING_REVIEW per temple (enforced by application).
     */
    Optional<TempleProfileStaging> findTopByTempleIdAndStatusOrderByVersionDesc(Long templeId, ProfileStagingStatus status);

    Optional<TempleProfileStaging> findByTempleIdAndVersion(Long templeId, int version);

    Page<TempleProfileStaging> findAllByTempleIdOrderByVersionDesc(Long templeId, Pageable pageable);

    boolean existsByTempleIdAndStatus(Long templeId, ProfileStagingStatus status);
}
