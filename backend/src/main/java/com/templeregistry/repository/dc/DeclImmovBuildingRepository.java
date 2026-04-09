package com.templeregistry.repository.dc;

import com.templeregistry.entity.dc.DeclImmovBuilding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeclImmovBuildingRepository extends JpaRepository<DeclImmovBuilding, Long> {
    List<DeclImmovBuilding> findAllByDeclarationId(Long declarationId);
}
