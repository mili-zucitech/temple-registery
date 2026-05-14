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

    @NotNull(message = "District is required.")
    private Long districtId;

    /** Optional city assignment for DC/DC_STAFF/TEMPLE_AUTHORITY users. */
    private Long cityId;

    /**
     * Required when role = TEMPLE_AUTHORITY.
     * The backend automatically creates a Temple record using this name.
     */
    @Size(max = 255)
    private String templeName;

    /**
     * Aadhaar number — 12 numeric digits. Required for TEMPLE_AUTHORITY.
     * Validated at service layer when role = TEMPLE_AUTHORITY.
     */
    @Pattern(regexp = "^\\d{12}$", message = "Aadhaar number must be exactly 12 digits.")
    private String aadhaarNumber;
}
