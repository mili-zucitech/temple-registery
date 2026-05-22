package com.templeregistry.repository.accesscontrol;

import com.templeregistry.entity.accesscontrol.AccessControlAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccessControlAuditLogRepository extends JpaRepository<AccessControlAuditLog, Long> {

    Page<AccessControlAuditLog> findAllByOrderByChangedAtDesc(Pageable pageable);

    Page<AccessControlAuditLog> findAllByPolicyIdOrderByChangedAtDesc(Long policyId, Pageable pageable);

    Page<AccessControlAuditLog> findAllByChangedByUserIdOrderByChangedAtDesc(Long userId, Pageable pageable);
}
