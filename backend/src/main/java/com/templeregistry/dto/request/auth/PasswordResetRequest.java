package com.templeregistry.dto.request.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PasswordResetRequest {

    @Email(message = "Email must be a valid email address.")
    @NotBlank(message = "Email is required.")
    private String email;
}
