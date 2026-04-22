package com.templeregistry.repository.dc;

import com.templeregistry.entity.dc.DeclMovPreciousMetal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface DeclMovPreciousMetalRepository extends JpaRepository<DeclMovPreciousMetal, Long> {
    List<DeclMovPreciousMetal> findAllByDeclarationId(Long declarationId);

    @Transactional
    void deleteByDeclarationId(Long declarationId);
}
