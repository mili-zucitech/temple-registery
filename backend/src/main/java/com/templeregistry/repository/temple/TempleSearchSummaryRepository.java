package com.templeregistry.repository.temple;

import com.templeregistry.entity.temple.TempleSearchSummary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TempleSearchSummaryRepository extends JpaRepository<TempleSearchSummary, Long>,
        JpaSpecificationExecutor<TempleSearchSummary> {

    Optional<TempleSearchSummary> findByTempleId(Long templeId);

    @Modifying
    @Query("DELETE FROM TempleSearchSummary tss WHERE tss.templeId = :templeId")
    void deleteByTempleId(Long templeId);

    // ─── DC dashboard aggregation queries ─────────────────────────────────

    /**
     * Count temples in a district (SUPER_ADMIN: districtId null → all districts).
     * dc_e2e Section 7.1 — DC Dashboard KPIs.
     */
    @Query("SELECT COUNT(tss) FROM TempleSearchSummary tss WHERE (:districtId IS NULL OR tss.districtId = :districtId)")
    long countByDistrict(Long districtId);

    @Query("SELECT COALESCE(SUM(tss.pendingDeclarations), 0) FROM TempleSearchSummary tss WHERE (:districtId IS NULL OR tss.districtId = :districtId)")
    long sumPendingDeclarationsByDistrict(Long districtId);

    @Query("SELECT COALESCE(SUM(tss.overdueDeclarations), 0) FROM TempleSearchSummary tss WHERE (:districtId IS NULL OR tss.districtId = :districtId)")
    long sumOverdueDeclarationsByDistrict(Long districtId);

    @Query("SELECT COALESCE(SUM(tss.pendingProfileReview), 0) FROM TempleSearchSummary tss WHERE (:districtId IS NULL OR tss.districtId = :districtId)")
    long sumPendingProfileReviewByDistrict(Long districtId);

    /**
     * Grade distribution for a district — returns [grade, count] pairs.
     * Used by DC dashboard pie/bar chart.
     */
    @Query("SELECT tss.grade, COUNT(tss) FROM TempleSearchSummary tss WHERE (:districtId IS NULL OR tss.districtId = :districtId) GROUP BY tss.grade")
    java.util.List<Object[]> countByGradeForDistrict(Long districtId);

    /**
     * Taluk distribution for a district — returns [talukId, count] pairs (talukId may be null).
     */
    @Query("SELECT tss.talukId, COUNT(tss) FROM TempleSearchSummary tss WHERE (:districtId IS NULL OR tss.districtId = :districtId) GROUP BY tss.talukId ORDER BY COUNT(tss) DESC")
    java.util.List<Object[]> countByTalukForDistrict(Long districtId);

    /**
     * District distribution (SUPER_ADMIN all-district view) — returns [districtId, count] pairs.
     */
    @Query("SELECT tss.districtId, COUNT(tss) FROM TempleSearchSummary tss GROUP BY tss.districtId ORDER BY COUNT(tss) DESC")
    java.util.List<Object[]> countByDistrict();

    /**
     * Count temples by templeStatus string value (e.g. "ACTIVE", "SUSPENDED").
     * Used by statewide dashboard.
     */
    @Query("SELECT COUNT(tss) FROM TempleSearchSummary tss WHERE tss.templeStatus = :status")
    long countAll(@org.springframework.data.repository.query.Param("status") String status);

    /**
     * Count temples without any approved declaration (hasApprovedDeclaration = false).
     * Used by DcDashboardService KPI: templesWithoutApprovedDeclaration.
     */
    @Query("SELECT COUNT(tss) FROM TempleSearchSummary tss WHERE (:districtId IS NULL OR tss.districtId = :districtId) AND tss.hasApprovedDeclaration = false")
    long countWithoutApprovedDeclarationByDistrict(Long districtId);

    /**
     * Paginated district-scoped search on the summary table.
     * Used by DcTempleSearchService — single table, no JOIN needed.
     * Executes as a SQL JOIN chain when Specification injects the district filter.
     * dc_e2e Section 2.5 — query-level district filter (Layer 3 RBAC).
     */
    Page<TempleSearchSummary> findAllByDistrictId(Long districtId, Pageable pageable);

    /**
     * Returns only temples that have at least one compliance anomaly.
     * Used by AuditorService — avoids loading all temples into memory.
     */
    @Query("SELECT tss FROM TempleSearchSummary tss WHERE " +
           "(tss.overdueDeclarations IS NOT NULL AND tss.overdueDeclarations > 0) OR " +
           "tss.hasApprovedDeclaration = false OR " +
           "tss.trustRegistered = false")
    java.util.List<TempleSearchSummary> findAllWithAnomalies();
}
