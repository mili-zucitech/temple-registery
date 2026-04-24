package com.templeregistry.dto.request.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Step 2: Create the user account and temple record.
 * Accepts Aadhaar number directly (no OTP verification required).
 * Password policy enforces SC-04: min 10 chars, uppercase, lowercase, digit, special char.
 */
@Getter
@NoArgsConstructor
public class CreateAccountRequest {

    @NotBlank(message = "Aadhaar number is required.")
    @Pattern(regexp = "^\\d{12}$", message = "Aadhaar number must be exactly 12 digits.")
    private String aadhaar;

    @NotBlank(message = "Username is required.")
    @Size(min = 4, max = 100, message = "Username must be 4–100 characters.")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$",
            message = "Username may only contain letters, digits, dots, underscores, or hyphens.")
    private String username;

    @NotBlank(message = "Email is required.")
    @Email(message = "Email must be a valid email address.")
    @Size(max = 255, message = "Email must not exceed 255 characters.")
    private String email;

    /**
     * SC-04 enforcement: min 10 chars, at least one uppercase, one lowercase,
     * one digit, one special character.
     */
    @NotBlank(message = "Password is required.")
    @Size(min = 10, max = 128, message = "Password must be 10–128 characters.")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{}|;':\",./<>?]).+$",
            message = "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character."
    )
    private String password;

    @NotBlank(message = "Full name is required.")
    @Size(max = 200, message = "Full name must not exceed 200 characters.")
    private String fullName;

    @NotBlank(message = "Mobile number is required.")
    @Pattern(regexp = "^\\d{10}$", message = "Mobile number must be exactly 10 digits.")
    private String mobile;

    @NotNull(message = "Temple details are required.")
    @Valid
    private TempleRegistrationRequest temple;
}
