package com.templeregistry.controller.auth;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.dto.request.auth.AadhaarOtpRequest;
import com.templeregistry.dto.request.auth.RegisterRequest;
import com.templeregistry.dto.response.auth.AadhaarOtpResponse;
import com.templeregistry.service.auth.RegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Registration", description = "Aadhaar eKYC and new user registration endpoints")
public class RegistrationController {

    private final RegistrationService registrationService;

    @PostMapping("/aadhaar-otp-req")
    @Operation(summary = "Request Aadhaar OTP (step 1 of registration)")
    public ResponseEntity<ApiResponse<AadhaarOtpResponse>> requestAadhaarOtp(
            @Valid @RequestBody AadhaarOtpRequest request) {
        AadhaarOtpResponse response = registrationService.requestAadhaarOtp(request);
        return ResponseEntity.ok(ApiResponse.success("OTP sent.", response));
    }

    @PostMapping("/aadhaar-otp-verify")
    @Operation(summary = "Verify Aadhaar OTP (step 2 of registration); returns verification token")
    public ResponseEntity<ApiResponse<AadhaarOtpResponse>> verifyAadhaarOtp(
            @Valid @RequestBody AadhaarOtpRequest request,
            @RequestParam @NotBlank String otp) {
        AadhaarOtpResponse response = registrationService.verifyAadhaarOtp(request, otp);
        return ResponseEntity.ok(ApiResponse.success("Aadhaar verified.", response));
    }

    @PostMapping("/register")
    @Operation(summary = "Complete user registration after Aadhaar verification")
    public ResponseEntity<ApiResponse<Void>> register(
            @Valid @RequestBody RegisterRequest request) {
        registrationService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful. Awaiting admin activation."));
    }
}
