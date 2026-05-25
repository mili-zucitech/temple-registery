package com.templeregistry.repository.notification;

import com.templeregistry.entity.notification.EmailOutbox;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

/**
 * Repository for the DB-backed email outbox.
 */
@Repository
public interface EmailOutboxRepository extends JpaRepository<EmailOutbox, Long> {

    /**
     * Fetch the next batch of PENDING emails ordered by priority (HIGH first) then age.
     * HIGH/CRITICAL priority emails are processed before MEDIUM/LOW using field ordering:
     * CRITICAL → 1, HIGH → 2, MEDIUM → 3, LOW → 4.
     */
    @Query("""
        SELECT e FROM EmailOutbox e
        WHERE e.status = 'PENDING'
        ORDER BY
          CASE e.priority
            WHEN 'CRITICAL' THEN 1
            WHEN 'HIGH'     THEN 2
            WHEN 'MEDIUM'   THEN 3
            ELSE                 4
          END,
          e.createdAt ASC
        LIMIT :limit
        """)
    List<EmailOutbox> findPendingBatch(@Param("limit") int limit);

    /**
     * Fetch FAILED emails eligible for retry: retry count below max and back-off time has elapsed.
     */
    @Query("""
        SELECT e FROM EmailOutbox e
        WHERE e.status = 'FAILED'
          AND e.retryCount < e.maxRetries
          AND (e.nextRetryAt IS NULL OR e.nextRetryAt <= :now)
        ORDER BY e.nextRetryAt ASC NULLS FIRST
        LIMIT :limit
        """)
    List<EmailOutbox> findRetryableBatch(@Param("now") Instant now, @Param("limit") int limit);

    /** Count DEAD_LETTER emails — used for monitoring / startup alerts. */
    long countByStatus(String status);
}
