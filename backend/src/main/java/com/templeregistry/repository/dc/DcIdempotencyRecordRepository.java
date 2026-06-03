package com.templeregistry.repository.dc;

import com.templeregistry.entity.dc.IdempotencyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface DcIdempotencyRecordRepository extends JpaRepository<IdempotencyRecord, Long> {

    /**
     * Lookup for idempotency cache hit check.
     * Returns stored response if the same actor has already executed an operation
     * with this key within the TTL window.
     */
    Optional<IdempotencyRecord> findByActorUserIdAndIdempotencyKey(Long actorUserId, String idempotencyKey);

    /**
     * Cleanup: delete all expired records (called by a scheduled cleanup task).
     * dc_e2e Section 4.12b.
     */
    @Modifying
    @Query("DELETE FROM DcIdempotencyRecord ir WHERE ir.expiresAt < :cutoff")
    int deleteExpiredBefore(LocalDateTime cutoff);
}
