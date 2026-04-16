package com.templeregistry.repository.dc;

import com.templeregistry.entity.dc.TempleProfileHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TempleProfileHistoryRepository extends JpaRepository<TempleProfileHistory, Long> {

    /**
     * Returns all archived profiles for a temple, newest first.
     * Used by DC profile timeline view.
     */
    List<TempleProfileHistory> findAllByTempleIdOrderByVersionDesc(Long templeId);
}
