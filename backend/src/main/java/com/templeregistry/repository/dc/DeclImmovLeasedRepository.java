package com.templeregistry.repository.dc;

import com.templeregistry.entity.dc.DeclImmovLeased;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface DeclImmovLeasedRepository extends JpaRepository<DeclImmovLeased, Long> {
    List<DeclImmovLeased> findAllByDeclarationId(Long declarationId);

    @Transactional
    void deleteByDeclarationId(Long declarationId);
}
