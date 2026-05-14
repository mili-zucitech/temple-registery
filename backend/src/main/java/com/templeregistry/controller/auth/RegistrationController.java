package com.templeregistry.controller.auth;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.dto.request.auth.CreateAccountRequest;
import com.templeregistry.dto.response.auth.CreateAccountResponse;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.service.auth.MfaService;
import com.templeregistry.service.auth.RegistrationService;
import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** @deprecated Public registration removed. TA users created by Super Admin only. */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Temple Authority Registration (deprecated)")
@Hidden
@Deprecated
public class RegistrationController {

    private final RegistrationService registrationService;
    private final MfaService          mfaService;

    @PostMapping("/register/create")
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    public ResponseEntity<ApiResponse<CreateAccountResponse>> createAccount(
            @Valid @RequestBody CreateAccountRequest request) {
        CreateAccountResponse response = registrationService.createAccount(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Account created.", response));
    }
}
