package com.templeregistry.dto.request.admin;

import com.templeregistry.entity.auth.UserRole;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateUserRequest {

    @NotBlank @Size(min = 3, max = 64)
    private String username;

    @NotBlank @Email
    private String email;

    @NotBlank @Size(min = 8, max = 128)
    private String password;

    @NotBlank @Size(max = 128)
    private String fullName;

    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid Indian mobile number.")
    private String mobile;

    @NotNull
    private UserRole role;

    private Long districtId;
    private Long templeId;
}
