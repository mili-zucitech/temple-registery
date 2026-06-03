package com.templeregistry.dto.request.auth;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Username is required.")
    @Size(min = 4, max = 100, message = "Username must be 4-100 characters.")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$",
            message = "Username may only contain letters, digits, dots, underscores, or hyphens.")
    private String username;

    @NotBlank(message = "Email is required.")
    @Email(message = "Email must be a valid email address.")
    @Size(max = 255, message = "Email must not exceed 255 characters.")
    private String email;

    @NotBlank(message = "Password is required.")
    @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters.")
    private String password;

    @NotBlank(message = "Full name is required.")
    @Size(max = 200, message = "Full name must not exceed 200 characters.")
    private String fullName;

    @Size(max = 15, message = "Mobile must not exceed 15 characters.")
    private String mobile;

    @NotBlank(message = "Aadhaar OTP verification token is required.")
    private String aadhaarVerificationToken;
}
