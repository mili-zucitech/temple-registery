package com.templeregistry.repository.dc;

import com.templeregistry.entity.dc.DeclImmovAgriLand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeclImmovAgriLandRepository extends JpaRepository<DeclImmovAgriLand, Long> {
    List<DeclImmovAgriLand> findAllByDeclarationId(Long declarationId);

    @Transactional
    void deleteByDeclarationId(Long declarationId);
}
