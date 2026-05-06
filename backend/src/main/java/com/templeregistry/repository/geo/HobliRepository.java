package com.templeregistry.repository.geo;

import com.templeregistry.entity.geo.Hobli;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HobliRepository extends JpaRepository<Hobli, Long> {

    List<Hobli> findAllByTalukId(Long talukId);

    /**
     * Fetches hobli with its full geo chain (taluk → district → city) in a single query.
     * Required by RegistrationServiceImpl to resolve districtId, talukId and cityId
     * during temple creation without N+1 lazy-load traversal.
     */
    @EntityGraph(attributePaths = {"taluk", "taluk.district", "taluk.district.city"})
    Optional<Hobli> findWithGeoById(Long id);
}
