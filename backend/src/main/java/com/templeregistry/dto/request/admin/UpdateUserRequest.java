package com.templeregistry.dto.request.admin;

import com.templeregistry.entity.auth.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateUserRequest {

    @Email
    private String email;

    @Size(max = 128)
    private String fullName;

    private String mobile;
    private UserRole role;
    private Boolean active;
    private Long districtId;
    private Long templeId;
}
