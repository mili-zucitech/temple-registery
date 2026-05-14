package com.templeregistry.repository.dc;

import com.templeregistry.entity.dc.DeclImmovOther;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface DeclImmovOtherRepository extends JpaRepository<DeclImmovOther, Long> {
    List<DeclImmovOther> findAllByDeclarationId(Long declarationId);

    @Transactional
    void deleteByDeclarationId(Long declarationId);
}
