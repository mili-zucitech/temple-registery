package com.templeregistry.repository.geo;

import com.templeregistry.entity.geo.District;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DistrictRepository extends JpaRepository<District, Long> {
    List<District> findAllByCityId(Long cityId);
    Optional<District> findById(Long id);
}
