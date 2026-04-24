package com.templeregistry.controller.auth;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.dto.request.auth.AadhaarVerifyRequest;
import com.templeregistry.dto.request.auth.CreateAccountRequest;
import com.templeregistry.dto.request.auth.MfaSetupRequest;
import com.templeregistry.dto.request.auth.MfaSetupVerifyRequest;
import com.templeregistry.dto.request.auth.RegistrationInitRequest;
import com.templeregistry.dto.response.auth.AadhaarOtpResponse;
import com.templeregistry.dto.response.auth.CreateAccountResponse;
import com.templeregistry.dto.response.auth.MfaSetupVerifyResponse;
import com.templeregistry.dto.response.auth.RegistrationInitResponse;
import com.templeregistry.service.auth.MfaService;
import com.templeregistry.service.auth.RegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Temple Authority registration flow — simplified 2-step process:
 *
 *  Step 1: POST /api/v1/auth/register/create         → Create user + temple atomically (with Aadhaar)
 *  Step 2: Super Admin activates the account
 *
 * All endpoints are public (no auth required). No business logic — delegates to services only.
 * 
 * Note: Aadhaar OTP verification, MFA setup, and recovery codes have been removed from the registration flow.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Temple Authority Registration",
     description = "Simplified registration flow: account creation with Aadhaar")
public class RegistrationController {

    private final RegistrationService registrationService;
    private final MfaService          mfaService;

    // ── Step 1 ────────────────────────────────────────────────────────────────

    @PostMapping("/register/create")
    @Operation(
            summary = "Step 1: Create user account and temple",
            description = "Atomically creates the TEMPLE_AUTHORITY user and the linked temple record. " +
                          "Accepts Aadhaar number directly (no OTP verification). " +
                          "Account is inactive until a Super Admin activates it."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "User and temple created; userId returned"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Username or email already taken")
    })
    public ResponseEntity<ApiResponse<CreateAccountResponse>> createAccount(
            @Valid @RequestBody CreateAccountRequest request) {
        CreateAccountResponse response = registrationService.createAccount(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Account created. Awaiting Super Admin activation.", response));
    }
}
