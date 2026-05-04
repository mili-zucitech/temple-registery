package com.templeregistry.repository.notification;

import com.templeregistry.entity.notification.NotificationOutbox;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationOutboxRepository extends JpaRepository<NotificationOutbox, Long> {

    @Query("""
        SELECT no FROM NotificationOutbox no
        WHERE no.dispatchStatus = 'PENDING'
          AND no.deleted = false
        ORDER BY no.createdAtInstant ASC
        LIMIT :limit
        """)
    List<NotificationOutbox> findPendingBatch(@Param("limit") int limit);

    @Query("""
        SELECT no FROM NotificationOutbox no
        WHERE no.dispatchStatus = 'FAILED'
          AND no.retryCount < 3
          AND no.deleted = false
        ORDER BY no.createdAtInstant ASC
        LIMIT :limit
        """)
    List<NotificationOutbox> findRetryableBatch(@Param("limit") int limit);
}
