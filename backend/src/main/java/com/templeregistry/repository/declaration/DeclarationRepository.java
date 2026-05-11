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

    /**
     * Temple-scoped paginated list excluding DRAFT declarations.
     * Used by DC-facing temple profile view — DCs should not see TA workspace drafts.
     */
    @Query("SELECT d FROM AssetDeclaration d WHERE d.templeId = :templeId AND d.status != 'DRAFT'")
    Page<AssetDeclaration> findAllByTempleIdExcludingDraft(Long templeId, Pageable pageable);

    @Query("SELECT d FROM AssetDeclaration d WHERE d.status = 'SUBMITTED' AND d.dueDate < :today")
    List<AssetDeclaration> findOverdue(LocalDate today);

    @Query("SELECT d FROM AssetDeclaration d WHERE d.dueDate < :today AND d.status NOT IN ('APPROVED', 'REJECTED', 'SUPERSEDED', 'OVERDUE')")
    List<AssetDeclaration> findDeclarationsToFlagAsOverdue(LocalDate today);

    Page<AssetDeclaration> findAllByDistrictIdAndStatus(Long districtId, DeclarationStatus status, Pageable pageable);

    /**
     * SA query: declarations stuck in SITE_VISIT_SCHEDULED beyond a date
     * threshold.
     */
    @Query("SELECT d FROM AssetDeclaration d WHERE d.status = 'SITE_VISIT_SCHEDULED' AND d.submittedAt < :thresholdDateTime")
    Page<AssetDeclaration> findPhysicalVerificationPendingOlderThan(java.time.LocalDateTime thresholdDateTime,
            Pageable pageable);

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
     * District-scoped paginated list excluding DRAFT declarations.
     * Used by DC-facing list endpoint — DCs should not see TA workspace drafts.
     */
    @Query("SELECT d FROM AssetDeclaration d WHERE d.districtId = :districtId AND d.status != 'DRAFT'")
    Page<AssetDeclaration> findAllByDistrictIdExcludingDraft(Long districtId, Pageable pageable);

    /**
     * SA: all declarations excluding DRAFT.
     */
    @Query("SELECT d FROM AssetDeclaration d WHERE d.status != 'DRAFT'")
    Page<AssetDeclaration> findAllExcludingDraft(Pageable pageable);

    /**
     * SUPER_ADMIN: all declarations filtered by status only, no district
     * restriction.
     */
    Page<AssetDeclaration> findAllByStatus(DeclarationStatus status, Pageable pageable);

    /**
     * District-scoped query with status and financial year filter.
     */
    Page<AssetDeclaration> findAllByDistrictIdAndStatusAndFinancialYear(Long districtId, DeclarationStatus status, String financialYear, Pageable pageable);

    /**
     * SUPER_ADMIN: all declarations filtered by status and financial year.
     */
    Page<AssetDeclaration> findAllByStatusAndFinancialYear(DeclarationStatus status, String financialYear, Pageable pageable);

    /**
     * Count declarations requiring DC attention for a given district.
     * dc_e2e Section 2.6 (S9) — pending_declarations counts all active states.
     */
    @Query("SELECT COUNT(d) FROM AssetDeclaration d WHERE d.districtId = :districtId " +
            "AND d.status IN ('SUBMITTED', 'UNDER_REVIEW', 'CLARIFICATION_REQUIRED', 'CLARIFICATION_RESPONDED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'VERIFIED')")
    long countActivePendingByDistrict(Long districtId);

    boolean existsByTempleIdAndStatusIn(Long templeId, List<DeclarationStatus> statuses);

    Optional<AssetDeclaration> findTopByTempleIdAndFinancialYearOrderByVersionNumberDesc(Long templeId, String financialYear);

    Optional<AssetDeclaration> findByTempleIdAndFinancialYearAndVersionNumber(Long templeId, String financialYear, int versionNumber);

    List<AssetDeclaration> findAllByTempleIdAndFinancialYearOrderByVersionNumberDesc(Long templeId, String financialYear);

    /**
     * Find all acknowledgement numbers that start with the given prefix.
     * Used by AcknowledgementService to determine the next sequence number.
     */
    @Query("SELECT d.acknowledgementNumber FROM AssetDeclaration d WHERE d.acknowledgementNumber LIKE :prefix%")
    List<String> findAcknowledgementNumbersByPrefix(@org.springframework.data.repository.query.Param("prefix") String prefix);

    /**
     * Bulk update: mark declarations as overdue where due_date < today and status is not terminal.
     * Used by OverdueScheduler.
     */
    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE AssetDeclaration d SET d.isOverdue = true, d.overdueFlaggedAt = :now " +
           "WHERE d.dueDate < :today AND d.status NOT IN :terminalStatuses AND d.isOverdue = false")
    int markOverdue(@org.springframework.data.repository.query.Param("today") java.time.LocalDate today,
                    @org.springframework.data.repository.query.Param("now") java.time.LocalDateTime now,
                    @org.springframework.data.repository.query.Param("terminalStatuses") java.util.List<DeclarationStatus> terminalStatuses);

    /**
     * Find overdue declarations for a district (paginated).
     */
    Page<AssetDeclaration> findByIsOverdueTrueAndDistrictId(Long districtId, Pageable pageable);

    /**
     * Check if the temple has at least one declaration with the given status.
     * Used by TempleSearchSummaryService for hasApprovedDeclaration flag.
     */
    boolean existsByTempleIdAndStatus(Long templeId, DeclarationStatus status);

    /**
     * Count declarations for a temple by status set.
     * Used by TempleSearchSummaryService to populate pendingDeclarations counter.
     */
    long countByTempleIdAndStatusIn(Long templeId, List<DeclarationStatus> statuses);

    /**
     * Count declarations for a temple with a single status.
     * Used by TempleSearchSummaryService to populate overdueDeclarations counter.
     */
    long countByTempleIdAndStatus(Long templeId, DeclarationStatus status);
}
