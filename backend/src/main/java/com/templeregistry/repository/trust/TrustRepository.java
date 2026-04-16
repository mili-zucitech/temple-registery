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
    boolean existsByTempleIdAndStatus(Long templeId, TrustStatus status);
    boolean existsByTrustRegistrationNumberAndStatus(String trustRegistrationNumber, TrustStatus status);
}
