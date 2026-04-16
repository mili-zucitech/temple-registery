package com.templeregistry.repository.geo;

import com.templeregistry.entity.geo.District;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DistrictRepository extends JpaRepository<District, Long> {
    List<District> findAllByCityId(Long cityId);
    List<District> findAllByCityStateId(Long stateId);
    Optional<District> findById(Long id);

    @org.springframework.data.jpa.repository.Query("SELECT d.city.id FROM District d WHERE d.id = :id")
    Optional<Long> findCityIdById(@org.springframework.data.repository.query.Param("id") Long id);
}
