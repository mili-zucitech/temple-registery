package com.templeregistry.repository.trust;

import com.templeregistry.entity.trust.TrustFinancial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TrustFinancialRepository extends JpaRepository<TrustFinancial, Long> {
    List<TrustFinancial> findAllByTrustIdOrderByFinancialYearDesc(Long trustId);
}
