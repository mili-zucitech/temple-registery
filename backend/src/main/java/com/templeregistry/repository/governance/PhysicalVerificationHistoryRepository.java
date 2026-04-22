package com.templeregistry.repository.governance;

import com.templeregistry.entity.governance.PhysicalVerificationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for physical verification audit history.
 * Results are DC-only — never expose to Temple Authority.
 */
@Repository
public interface PhysicalVerificationHistoryRepository extends JpaRepository<PhysicalVerificationHistory, Long> {

    List<PhysicalVerificationHistory> findAllByDeclarationIdOrderByOccurredAtDesc(Long declarationId);
}
