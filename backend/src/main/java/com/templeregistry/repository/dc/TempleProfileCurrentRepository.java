package com.templeregistry.repository.dc;

import com.templeregistry.entity.dc.TempleProfileCurrent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TempleProfileCurrentRepository extends JpaRepository<TempleProfileCurrent, Long> {

    Optional<TempleProfileCurrent> findByTempleId(Long templeId);

    boolean existsByTempleId(Long templeId);
}
