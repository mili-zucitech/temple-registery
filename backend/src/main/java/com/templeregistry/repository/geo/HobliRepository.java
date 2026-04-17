package com.templeregistry.repository.geo;

import com.templeregistry.entity.geo.Hobli;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HobliRepository extends JpaRepository<Hobli, Long> {
    List<Hobli> findAllByTalukId(Long talukId);
}
