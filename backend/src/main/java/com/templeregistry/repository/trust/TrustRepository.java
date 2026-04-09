package com.templeregistry.repository.trust;

import com.templeregistry.entity.trust.TrustRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TrustRepository extends JpaRepository<TrustRegistration, Long> {
    List<TrustRegistration> findAllByTempleId(Long templeId);
    Optional<TrustRegistration> findByIdAndTempleId(Long id, Long templeId);
}
