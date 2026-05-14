package com.templeregistry.repository.temple;

import com.templeregistry.entity.temple.Temple;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TempleRepository extends JpaRepository<Temple, Long>,
        JpaSpecificationExecutor<Temple> {

    Optional<Temple> findByRegistrationNumber(String registrationNumber);

    boolean existsByRegistrationNumber(String registrationNumber);

    Page<Temple> findAllByDistrictId(Long districtId, Pageable pageable);

    /**
     * Load a temple with its full geo chain in one query: hobli → taluk → district.
     * Required by JurisdictionGuard.assertDistrictScope() which traverses all three hops.
     * Using @EntityGraph prevents N+1 on the lazy-loaded associations.
     * dc_e2e Section 2.5 (district scope traversal).
     */
    @EntityGraph(attributePaths = {"hobli", "hobli.taluk", "hobli.taluk.district"})
    Optional<Temple> findWithGeoById(Long id);

    /**
     * Load a single temple with the complete 4-hop geo chain: hobli → taluk → district → city.
     * Used by TempleSearchSummaryServiceImpl.refresh() to derive all geo scalar IDs
     * from the canonical association chain rather than flat denormalized columns.
     */
    @EntityGraph(attributePaths = {"hobli", "hobli.taluk", "hobli.taluk.district", "hobli.taluk.district.city"})
    Optional<Temple> findWithFullGeoById(Long id);

    /**
     * Load all temples with the complete 4-hop geo chain in a single query.
     * Used by TempleSearchSummaryServiceImpl.rebuildAll() to avoid N+1 when recomputing
     * the entire temple_search_summary table.
     */
    @Query("SELECT t FROM Temple t LEFT JOIN FETCH t.hobli h LEFT JOIN FETCH h.taluk ta LEFT JOIN FETCH ta.district d LEFT JOIN FETCH d.city")
    List<Temple> findAllWithFullGeo();
}
