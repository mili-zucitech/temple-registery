package com.templeregistry.repository.declaration;

import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.DeclarationStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DeclarationRepository extends JpaRepository<AssetDeclaration, Long> {

    Page<AssetDeclaration> findAllByTempleId(Long templeId, Pageable pageable);

    @Query("SELECT d FROM AssetDeclaration d WHERE d.status = 'SUBMITTED' AND d.dueDate < :today")
    List<AssetDeclaration> findOverdue(LocalDate today);

    Page<AssetDeclaration> findAllByDistrictIdAndStatus(Long districtId, DeclarationStatus status, Pageable pageable);

    /** SA query: declarations stuck in PHYSICAL_VERIFICATION_REQUESTED beyond a date threshold. */
    @Query("SELECT d FROM AssetDeclaration d WHERE d.status = 'PHYSICAL_VERIFICATION_REQUESTED' AND d.submittedAt < :thresholdDateTime")
    Page<AssetDeclaration> findPhysicalVerificationPendingOlderThan(java.time.LocalDateTime thresholdDateTime, Pageable pageable);
    /**
     * Load a declaration with pessimistic write lock for workflow mutations.
     * Prevents concurrent approve/reject/clarify operations on the same row.
     * Callers must be inside an active @Transactional write transaction.
     * dc_e2e Section 3.2 — PESSIMISTIC_WRITE for workflow idempotency.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM AssetDeclaration d WHERE d.id = :id")
    Optional<AssetDeclaration> findByIdWithLock(Long id);

    /**
     * District-scoped paginated list for DC search and dashboard.
     * districtId = null means SUPER_ADMIN (handled by Specification layer).
     */
    Page<AssetDeclaration> findAllByDistrictId(Long districtId, Pageable pageable);

    /**
     * Count declarations requiring DC attention for a given district.
     * dc_e2e Section 2.6 (S9) — pending_declarations counts all 3 active states.
     */
    @Query("SELECT COUNT(d) FROM AssetDeclaration d WHERE d.districtId = :districtId " +
           "AND d.status IN ('PENDING_REVIEW', 'CLARIFICATION_REQUESTED', 'PHYSICAL_VERIFICATION_REQUESTED')")
    long countActivePendingByDistrict(Long districtId);

    boolean existsByTempleIdAndStatusIn(Long templeId, List<DeclarationStatus> statuses);
}
