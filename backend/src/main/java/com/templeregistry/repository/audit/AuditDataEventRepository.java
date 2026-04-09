package com.templeregistry.repository.audit;

import com.templeregistry.entity.audit.AuditDataEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditDataEventRepository extends JpaRepository<AuditDataEvent, Long> {

    Page<AuditDataEvent> findAllByActorIdOrderByOccurredAtDesc(Long actorId, Pageable pageable);

    Page<AuditDataEvent> findAllByEntityTypeAndEntityId(String entityType, Long entityId, Pageable pageable);
}
