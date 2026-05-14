package com.templeregistry.repository.observation;

import com.templeregistry.entity.observation.Observation;
import com.templeregistry.entity.observation.ObservationSeverity;
import com.templeregistry.entity.observation.ObservationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ObservationRepository extends JpaRepository<Observation, Long> {

    Page<Observation> findAllByDeletedFalse(Pageable pageable);

    Page<Observation> findAllByTempleIdAndDeletedFalse(Long templeId, Pageable pageable);

    Page<Observation> findAllByStatusAndDeletedFalse(ObservationStatus status, Pageable pageable);

    Page<Observation> findAllBySeverityAndDeletedFalse(ObservationSeverity severity, Pageable pageable);

    Page<Observation> findAllByRaisedByUserIdAndDeletedFalse(Long userId, Pageable pageable);

    long countByStatusAndDeletedFalse(ObservationStatus status);
}
