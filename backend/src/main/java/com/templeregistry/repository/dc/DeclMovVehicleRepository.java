package com.templeregistry.repository.dc;

import com.templeregistry.entity.dc.DeclMovVehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface DeclMovVehicleRepository extends JpaRepository<DeclMovVehicle, Long> {
    List<DeclMovVehicle> findAllByDeclarationId(Long declarationId);

    @Transactional
    void deleteByDeclarationId(Long declarationId);
}
