package com.templeregistry.repository.dc;

import com.templeregistry.entity.dc.RateRequestLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface RateRequestLogRepository extends JpaRepository<RateRequestLog, Long> {

    /**
     * Find the current window's counter for a user+endpoint.
     * windowStart is truncated to even 10-minute boundary by the service layer.
     * dc_e2e Section 4.12c.
     */
    Optional<RateRequestLog> findByUserIdAndEndpointKeyAndWindowStart(
            Long userId, String endpointKey, LocalDateTime windowStart);

    /**
     * Atomic increment via native UPSERT.
     * Inserts a new counter row or increments the existing count for the window.
     * Uses ON DUPLICATE KEY UPDATE to avoid race conditions on concurrent requests.
     * dc_e2e Section 4.12c.
     */
    @Modifying
    @Query(value = """
            INSERT INTO rate_request_log (user_id, endpoint_key, window_start, request_count, last_request_at)
            VALUES (:userId, :endpointKey, :windowStart, 1, NOW(6))
            ON DUPLICATE KEY UPDATE
                request_count  = request_count + 1,
                last_request_at = NOW(6)
            """, nativeQuery = true)
    void upsertCount(Long userId, String endpointKey, LocalDateTime windowStart);
}
