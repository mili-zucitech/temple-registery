package com.templeregistry.repository.dc;

import com.templeregistry.entity.dc.DeclMovFinancial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface DeclMovFinancialRepository extends JpaRepository<DeclMovFinancial, Long> {
    
    List<DeclMovFinancial> findAllByDeclarationId(Long declarationId);

    @Transactional
    void deleteByDeclarationId(Long declarationId);
}
