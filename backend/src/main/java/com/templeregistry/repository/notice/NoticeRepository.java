package com.templeregistry.repository.notice;

import com.templeregistry.entity.notice.Notice;
import com.templeregistry.entity.notice.NoticeScope;
import com.templeregistry.entity.notice.NoticeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface NoticeRepository extends JpaRepository<Notice, Long>, JpaSpecificationExecutor<Notice> {

    @EntityGraph(attributePaths = "attachments")
    Optional<Notice> findWithAttachmentsById(Long id);

    Page<Notice> findAllByDistrictIdAndStatus(Long districtId, NoticeStatus status, Pageable pageable);

    /**
     * TA dashboard feed: PUBLISHED notices visible to a given district
     * (district-scoped OR global), pinned first, then newest.
     */
    @Query("""
            SELECT n FROM Notice n
            WHERE n.status = 'PUBLISHED'
              AND n.deleted = false
              AND (n.scope = 'GLOBAL' OR n.districtId = :districtId)
            ORDER BY n.pinned DESC, n.publishedAt DESC
            """)
    List<Notice> findDashboardNotices(@Param("districtId") Long districtId, Pageable pageable);

    /**
     * Bulk-expire notices whose expiry date has passed and are still PUBLISHED.
     * Called by the nightly scheduler.
     */
    @Modifying
    @Query("""
            UPDATE Notice n
            SET n.status = 'EXPIRED'
            WHERE n.expiryDate IS NOT NULL
              AND n.expiryDate < :today
              AND n.status = 'PUBLISHED'
              AND n.deleted = false
            """)
    int bulkExpireByDate(@Param("today") LocalDate today);
}
