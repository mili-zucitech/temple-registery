package com.templeregistry.repository.dc;

import com.templeregistry.entity.dc.DeclMovArtifact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeclMovArtifactRepository extends JpaRepository<DeclMovArtifact, Long> {
    List<DeclMovArtifact> findAllByDeclarationId(Long declarationId);
}
