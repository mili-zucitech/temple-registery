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
 * Temple Authority registration flow — 5-step process:
 *
 *  Step 1: POST /api/v1/auth/register/init           → Aadhaar OTP dispatch (mock in dev)
 *  Step 2: POST /api/v1/auth/register/verify-aadhaar → OTP verification; returns AADHAAR_VERIFIED token
 *  Step 3: POST /api/v1/auth/register/create         → Create user + temple atomically
 *  Step 4: POST /api/v1/auth/mfa/setup               → Initiate SMS MFA; generates + stores OTP
 *  Step 5: POST /api/v1/auth/mfa/verify              → Verify OTP; enable MFA; return 8 recovery codes
 *
 * All endpoints are public (no auth required). No business logic — delegates to services only.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Temple Authority Registration",
     description = "5-step Aadhaar eKYC + account creation + SMS MFA registration flow")
public class RegistrationController {

    private final RegistrationService registrationService;
    private final MfaService          mfaService;

    // ── Step 1 ────────────────────────────────────────────────────────────────

    @PostMapping("/register/init")
    @Operation(
            summary = "Step 1: Initiate Aadhaar OTP",
            description = "Sends a mocked OTP to the Aadhaar-linked mobile. " +
                          "Dev values: aadhaar=123412341234, OTP will be 999999."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OTP dispatched; tempToken returned"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error or invalid Aadhaar")
    })
    public ResponseEntity<ApiResponse<RegistrationInitResponse>> initRegistration(
            @Valid @RequestBody RegistrationInitRequest request) {
        RegistrationInitResponse response = registrationService.initRegistration(request);
        return ResponseEntity.ok(ApiResponse.success("OTP sent to Aadhaar-linked mobile.", response));
    }

    // ── Step 2 ────────────────────────────────────────────────────────────────

    @PostMapping("/register/verify-aadhaar")
    @Operation(
            summary = "Step 2: Verify Aadhaar OTP",
            description = "Validates the OTP against the tempToken from step 1. " +
                          "Returns a new AADHAAR_VERIFIED tempToken (valid 10 min)."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Aadhaar verified; AADHAAR_VERIFIED token returned"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid or expired OTP / token")
    })
    public ResponseEntity<ApiResponse<AadhaarOtpResponse>> verifyAadhaar(
            @Valid @RequestBody AadhaarVerifyRequest request) {
        AadhaarOtpResponse response = registrationService.verifyAadhaar(request);
        return ResponseEntity.ok(ApiResponse.success("Aadhaar verified. Proceed to account creation.", response));
    }

    // ── Step 3 ────────────────────────────────────────────────────────────────

    @PostMapping("/register/create")
    @Operation(
            summary = "Step 3: Create user account and temple",
            description = "Atomically creates the TEMPLE_AUTHORITY user and the linked temple record. " +
                          "Requires the AADHAAR_VERIFIED tempToken from step 2. " +
                          "Account is inactive until a Super Admin activates it."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "User and temple created; userId returned"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error or invalid/expired token"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Username or email already taken")
    })
    public ResponseEntity<ApiResponse<CreateAccountResponse>> createAccount(
            @Valid @RequestBody CreateAccountRequest request) {
        CreateAccountResponse response = registrationService.createAccount(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Account created. Awaiting Super Admin activation.", response));
    }

    // ── Step 4 ────────────────────────────────────────────────────────────────

    @PostMapping("/mfa/setup")
    @Operation(
            summary = "Step 4: Initiate SMS MFA setup",
            description = "Generates a 6-digit OTP stored in-memory (5-min TTL) and " +
                          "dispatches it via SMS (dev: logged to console). " +
                          "User must not have MFA already configured."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OTP sent; proceed to /mfa/verify"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "MFA already configured")
    })
    public ResponseEntity<ApiResponse<Void>> setupMfa(
            @Valid @RequestBody MfaSetupRequest request) {
        mfaService.setupSmsMfa(request);
        return ResponseEntity.ok(ApiResponse.success("OTP sent. Please verify within 5 minutes."));
    }

    // ── Step 5 ────────────────────────────────────────────────────────────────

    @PostMapping("/mfa/verify")
    @Operation(
            summary = "Step 5: Verify OTP and enable SMS MFA",
            description = "Verifies the OTP from step 4. On success: enables SMS_OTP MFA, " +
                          "sets mfa_phone, and generates 8 bcrypt-hashed recovery codes. " +
                          "Recovery codes are returned ONCE in plain-text — store them securely."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "MFA enabled; 8 recovery codes returned"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error or invalid/expired OTP"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<ApiResponse<MfaSetupVerifyResponse>> verifyMfaSetup(
            @Valid @RequestBody MfaSetupVerifyRequest request) {
        MfaSetupVerifyResponse response = mfaService.verifyAndEnableMfa(request);
        return ResponseEntity.ok(ApiResponse.success("MFA enabled. Registration complete.", response));
    }
}
