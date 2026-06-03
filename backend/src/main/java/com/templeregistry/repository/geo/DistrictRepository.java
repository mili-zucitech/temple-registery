package com.templeregistry.repository.geo;

import com.templeregistry.entity.geo.District;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DistrictRepository extends JpaRepository<District, Long> {
    List<District> findAllByCityId(Long cityId);
    List<District> findAllByCityStateId(Long stateId);
    Optional<District> findById(Long id);

    @Query("SELECT d.city.id FROM District d WHERE d.id = :id")
    Optional<Long> findCityIdById(@Param("id") Long id);

    /** Find all districts whose name contains the given string (case-insensitive). */
    @Query("SELECT d FROM District d WHERE LOWER(d.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<District> findByNameContainingIgnoreCase(@Param("name") String name);
}
