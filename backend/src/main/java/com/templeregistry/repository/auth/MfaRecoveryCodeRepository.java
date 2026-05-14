package com.templeregistry.repository.auth;

import com.templeregistry.entity.auth.MfaRecoveryCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MfaRecoveryCodeRepository extends JpaRepository<MfaRecoveryCode, Long> {

    List<MfaRecoveryCode> findByUserIdAndUsedAtIsNull(Long userId);

    @Modifying
    @Query("UPDATE MfaRecoveryCode r SET r.usedAt = CURRENT_TIMESTAMP WHERE r.userId = :userId AND r.usedAt IS NULL")
    void invalidateAllForUser(@Param("userId") Long userId);
}
