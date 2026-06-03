package com.templeregistry.repository.geo;

import com.templeregistry.entity.geo.Taluk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TalukRepository extends JpaRepository<Taluk, Long> {
    List<Taluk> findAllByDistrictId(Long districtId);
}
