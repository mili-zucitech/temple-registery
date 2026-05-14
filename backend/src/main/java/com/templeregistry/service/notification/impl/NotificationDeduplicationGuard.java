package com.templeregistry.service.notification.impl;

import com.templeregistry.repository.notification.InAppNotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * DB-backed deduplication guard.
 *
 * Uses the unique {@code idempotency_key} column on {@code in_app_notifications}
 * to detect duplicates across process restarts and horizontal scale-out.
 *
 * Replaces the previous in-memory LRU implementation which failed under:
 *   - Pod restarts (in-memory state lost)
 *   - Multiple instances (each pod had its own LRU)
 *
 * Called by {@link NotificationRouter} before creating an in-app notification.
 * If a row already exists with the given key the event has already been processed
 * and is silently dropped.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationDeduplicationGuard {

    private final InAppNotificationRepository inAppNotificationRepository;

    /**
     * Returns true if a notification with this idempotency key already exists in the DB.
     */
    public boolean isDuplicate(String dedupKey) {
        if (dedupKey == null) return false;
        boolean exists = inAppNotificationRepository.existsByIdempotencyKey(dedupKey);
        if (exists) {
            log.debug("[DeduplicationGuard] Duplicate suppressed for key={}", dedupKey);
        }
        return exists;
    }

    /**
     * No-op: DB uniqueness is enforced at insert time by the unique index.
     * This method is kept for interface compatibility.
     */
    public void markSeen(String dedupKey) {
        // DB insert will enforce the unique constraint — nothing to do here.
    }
}
