package com.templeregistry.repository.dc;

import com.templeregistry.entity.dc.DeclMovEquipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeclMovEquipmentRepository extends JpaRepository<DeclMovEquipment, Long> {
    List<DeclMovEquipment> findAllByDeclarationId(Long declarationId);
}
