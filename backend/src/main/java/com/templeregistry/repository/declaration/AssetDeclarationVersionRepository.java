package com.templeregistry.repository.declaration;

import com.templeregistry.entity.declaration.AssetDeclarationVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetDeclarationVersionRepository extends JpaRepository<AssetDeclarationVersion, Long> {
    List<AssetDeclarationVersion> findByDeclarationIdOrderByVersionNumberDesc(Long declarationId);
}
