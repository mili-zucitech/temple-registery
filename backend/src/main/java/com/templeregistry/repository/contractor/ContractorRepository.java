package com.templeregistry.repository.contractor;

import com.templeregistry.entity.contractor.Contractor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContractorRepository extends JpaRepository<Contractor, Long> {
    Page<Contractor> findAllByTempleId(Long templeId, Pageable pageable);
    List<Contractor> findAllByTempleId(Long templeId);
}
