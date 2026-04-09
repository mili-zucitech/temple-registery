package com.templeregistry.dto.response.admin;

import com.templeregistry.entity.auth.UserRole;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserAdminResponse {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String mobile;
    private UserRole role;
    private boolean active;
    private boolean aadhaarVerified;
    private Long districtId;
    private Long templeId;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
}
