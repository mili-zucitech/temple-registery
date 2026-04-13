package com.templeregistry.entity.auth;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(name = "uk_users_username", columnNames = "username"),
        @UniqueConstraint(name = "uk_users_email", columnNames = "email")
})
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE users SET is_deleted = true, updated_at = NOW(6) WHERE id = ?")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity {

    @Column(name = "username", nullable = false, length = 100)
    private String username;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 30)
    private UserRole role;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(name = "mobile", length = 15)
    private String mobile;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "district_id")
    private Long districtId;

    @Column(name = "temple_id")
    private Long templeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "mfa_type", length = 20)
    private MfaType mfaType;

    @Column(name = "mfa_secret")
    private String mfaSecret;

    @Column(name = "mfa_phone", length = 15)
    private String mfaPhone;

    @Column(name = "failed_login_count")
    private int failedLoginCount = 0;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "aadhaar_verified", nullable = false)
    private boolean aadhaarVerified = false;
}
