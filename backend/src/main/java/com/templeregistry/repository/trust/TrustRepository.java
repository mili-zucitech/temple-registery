package com.templeregistry.repository.trust;

import com.templeregistry.entity.trust.Trust;
import com.templeregistry.entity.trust.TrustStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TrustRepository extends JpaRepository<Trust, Long> {
    List<Trust> findAllByTempleId(Long templeId);
    Optional<Trust> findByIdAndTempleId(Long id, Long templeId);
    Optional<Trust> findByTrustRegistrationNumberIgnoreCase(String registrationNumber);
    Optional<Trust> findByTrustPANNumberIgnoreCase(String trustPANNumber);
    boolean existsByTempleIdAndDeletedFalse(Long templeId);
    /** Used by TempleSearchSummaryService to populate the hasActiveTrust flag on the search summary. */
    boolean existsByTempleIdAndStatusAndDeletedFalse(Long templeId, TrustStatus status);
}
