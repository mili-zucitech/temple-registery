package com.templeregistry.repository.declaration;

import com.templeregistry.entity.declaration.DeclarationClarification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeclarationClarificationRepository extends JpaRepository<DeclarationClarification, Long> {
    List<DeclarationClarification> findAllByDeclarationIdOrderByCreatedAtAsc(Long declarationId);
}
