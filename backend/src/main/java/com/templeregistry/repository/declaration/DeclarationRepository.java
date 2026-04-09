package com.templeregistry.repository.declaration;

import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.DeclarationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DeclarationRepository extends JpaRepository<AssetDeclaration, Long> {

    Page<AssetDeclaration> findAllByTempleId(Long templeId, Pageable pageable);

    @Query("SELECT d FROM AssetDeclaration d WHERE d.status = 'SUBMITTED' AND d.dueDate < :today")
    List<AssetDeclaration> findOverdue(LocalDate today);

    Page<AssetDeclaration> findAllByDistrictIdAndStatus(Long districtId, DeclarationStatus status, Pageable pageable);

    /** SA query: declarations stuck in PHYSICAL_VERIFICATION_REQUESTED beyond a date threshold. */
    @Query("SELECT d FROM AssetDeclaration d WHERE d.status = 'PHYSICAL_VERIFICATION_REQUESTED' AND d.submittedAt < :thresholdDateTime")
    Page<AssetDeclaration> findPhysicalVerificationPendingOlderThan(java.time.LocalDateTime thresholdDateTime, Pageable pageable);
}
