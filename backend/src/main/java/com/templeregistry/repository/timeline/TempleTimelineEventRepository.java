package com.templeregistry.repository.timeline;

import com.templeregistry.entity.timeline.TempleTimelineEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TempleTimelineEventRepository extends JpaRepository<TempleTimelineEvent, Long> {

    /**
     * Retrieve paginated timeline events for a temple, sorted latest first.
     * Use Pageable with Sort.by("occurredAt").descending() or the named query handles it.
     */
    Page<TempleTimelineEvent> findByTempleIdOrderByOccurredAtDesc(Long templeId, Pageable pageable);

    /**
     * Idempotency guard: returns true if a timeline row for this workflow transition already exists.
     * The UNIQUE constraint at the DB level is the final guard; this check allows us to skip
     * the insert without relying on a constraint violation exception.
     */
    boolean existsBySourceTransitionId(Long sourceTransitionId);
}
