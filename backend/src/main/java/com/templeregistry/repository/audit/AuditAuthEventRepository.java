package com.templeregistry.repository.audit;

import com.templeregistry.entity.audit.AuditAuthEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditAuthEventRepository extends JpaRepository<AuditAuthEvent, Long> {

    Page<AuditAuthEvent> findAllByUserIdOrderByOccurredAtDesc(Long userId, Pageable pageable);

    Page<AuditAuthEvent> findAllByOrderByOccurredAtDesc(Pageable pageable);
}
