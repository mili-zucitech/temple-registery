package com.templeregistry.repository.temple;

import com.templeregistry.entity.temple.Temple;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TempleRepository extends JpaRepository<Temple, Long>,
        JpaSpecificationExecutor<Temple> {

    Optional<Temple> findByRegistrationNumber(String registrationNumber);

    boolean existsByRegistrationNumber(String registrationNumber);

    /**
     * Load a temple with its full geo chain in one query: hobli → taluk → district.
     * Required by JurisdictionGuard.assertDistrictScope() which traverses all three hops.
     * Using @EntityGraph prevents N+1 on the lazy-loaded associations.
     * dc_e2e Section 2.5 (district scope traversal).
     */
    @EntityGraph(attributePaths = {"hobli", "hobli.taluk", "hobli.taluk.district"})
    Optional<Temple> findWithGeoById(Long id);
}
