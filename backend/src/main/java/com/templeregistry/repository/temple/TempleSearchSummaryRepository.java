package com.templeregistry.repository.temple;

import com.templeregistry.entity.temple.TempleSearchSummary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface TempleSearchSummaryRepository extends JpaRepository<TempleSearchSummary, Long>,
        JpaSpecificationExecutor<TempleSearchSummary> {

    @Modifying
    @Query("DELETE FROM TempleSearchSummary tss WHERE tss.templeId = :templeId")
    void deleteByTempleId(Long templeId);
}
