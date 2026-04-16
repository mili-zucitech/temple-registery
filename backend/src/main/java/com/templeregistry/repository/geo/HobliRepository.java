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
     * Fetches hobli with its taluk and district in a single JOIN FETCH query.
     * Required by RegistrationServiceImpl to resolve districtId and talukId
     * during temple creation without N+1 lazy-load traversal.
     */
    @EntityGraph(attributePaths = {"taluk", "taluk.district"})
    Optional<Hobli> findWithGeoById(Long id);
}
