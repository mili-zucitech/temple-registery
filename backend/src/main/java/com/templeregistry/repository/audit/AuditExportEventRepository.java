package com.templeregistry.repository.audit;

import com.templeregistry.entity.audit.AuditExportEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditExportEventRepository extends JpaRepository<AuditExportEvent, Long> {

    Page<AuditExportEvent> findAllByActorIdOrderByOccurredAtDesc(Long actorId, Pageable pageable);
}
