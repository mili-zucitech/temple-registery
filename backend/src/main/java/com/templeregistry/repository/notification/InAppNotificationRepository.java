package com.templeregistry.repository.notification;

import com.templeregistry.entity.notification.InAppNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InAppNotificationRepository extends JpaRepository<InAppNotification, Long> {

    /** Paginated inbox — excludes soft-deleted rows. */
    Page<InAppNotification> findAllByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /** Unread count — excludes soft-deleted rows. */
    long countByUserIdAndIsReadAndDeletedAtIsNull(Long userId, boolean isRead);

    @Modifying
    @Query("UPDATE InAppNotification n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP " +
           "WHERE n.userId = :userId AND n.isRead = false AND n.deletedAt IS NULL")
    int markAllRead(@Param("userId") Long userId);

    /** Soft-delete a single notification owned by the given user. */
    @Modifying
    @Query("UPDATE InAppNotification n SET n.deletedAt = CURRENT_TIMESTAMP " +
           "WHERE n.id = :id AND n.userId = :userId AND n.deletedAt IS NULL")
    int softDeleteById(@Param("id") Long id, @Param("userId") Long userId);

    /** Soft-delete all non-deleted notifications for the given user. */
    @Modifying
    @Query("UPDATE InAppNotification n SET n.deletedAt = CURRENT_TIMESTAMP " +
           "WHERE n.userId = :userId AND n.deletedAt IS NULL")
    int softDeleteAllByUserId(@Param("userId") Long userId);

    /** Soft-delete a specific set of notifications owned by the given user. */
    @Modifying
    @Query("UPDATE InAppNotification n SET n.deletedAt = CURRENT_TIMESTAMP " +
           "WHERE n.id IN :ids AND n.userId = :userId AND n.deletedAt IS NULL")
    int softDeleteByIds(@Param("ids") List<Long> ids, @Param("userId") Long userId);

    boolean existsByIdempotencyKey(String idempotencyKey);
}
