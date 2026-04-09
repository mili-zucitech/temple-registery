package com.templeregistry.repository.geo;

import com.templeregistry.entity.geo.State;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface StateRepository extends JpaRepository<State, Long> {
    Optional<State> findByCode(String code);
    boolean existsByCode(String code);
}
