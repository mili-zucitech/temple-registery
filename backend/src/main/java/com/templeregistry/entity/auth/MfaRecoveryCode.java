package com.templeregistry.entity.auth;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@Table(name = "mfa_recovery_codes", indexes = {
        @Index(name = "idx_rc_user_available", columnList = "user_id, used_at")
})
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE mfa_recovery_codes SET is_deleted = true, updated_at = NOW(6) WHERE id = ?")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class MfaRecoveryCode extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "code_hash", nullable = false, length = 72)
    private String codeHash;

    @Column(name = "used_at")
    private LocalDateTime usedAt;
}
