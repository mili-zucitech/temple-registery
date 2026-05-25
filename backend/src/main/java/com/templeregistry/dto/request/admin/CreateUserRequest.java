package com.templeregistry.dto.request.admin;

import com.templeregistry.entity.auth.UserAccessType;
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
     * Aadhaar number — 12 numeric digits. Required for TEMPLE_AUTHORITY.
     * Validated at service layer when role = TEMPLE_AUTHORITY.
     */
    @Pattern(regexp = "^\\d{12}$", message = "Aadhaar number must be exactly 12 digits.")
    private String aadhaarNumber;

    // ─── Temple Authority: Two-case assignment ────────────────────────────────

    /**
     * When role = TEMPLE_AUTHORITY:
     *   true  → create a new temple (Case 1). templeName is required.
     *   false → assign an existing temple (Case 2). existingTempleId is required.
     * Defaults to true to preserve backward compatibility.
     */
    @Builder.Default
    private boolean createTemple = true;

    /**
     * Required when createTemple = true.
     * Used as the name of the newly created Temple record.
     */
    @Size(max = 255)
    private String templeName;

    /**
     * Required when createTemple = false.
     * The ID of the existing active temple to assign to this user.
     */
    private Long existingTempleId;

    /**
     * Optional role/designation for TEMPLE_AUTHORITY users
     * (e.g. "Trust Secretary", "Archaka", "Trustee").
     */
    @Size(max = 150)
    private String designation;

    /**
     * Access level for TEMPLE_AUTHORITY users.
     * VIEW = read-only; EDIT = full write access.
     * Defaults to EDIT. Non-TA roles are stored as EDIT.
     */
    @Builder.Default
    private UserAccessType accessType = UserAccessType.EDIT;

    /**
     * When {@code true}, the system sends a welcome email containing the username
     * and temporary password to the user's email address immediately after account creation.
     *
     * <p>Defaults to {@code false} — admin must explicitly opt-in to email dispatch.
     * The password is passed to the email renderer and is NEVER logged or stored in plaintext.
     */
    @Builder.Default
    private boolean sendCredentialsEmail = false;
}
