package com.templeregistry.service.impl.auth;

import com.templeregistry.dto.request.auth.AadhaarOtpRequest;
import com.templeregistry.dto.request.auth.RegisterRequest;
import com.templeregistry.dto.response.auth.AadhaarOtpResponse;
import com.templeregistry.exception.AadhaarVerificationException;
import com.templeregistry.exception.DuplicateResourceException;
import com.templeregistry.entity.auth.MfaType;
import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.service.auth.AadhaarService;
import com.templeregistry.service.auth.RegistrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RegistrationServiceImpl implements RegistrationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AadhaarService aadhaarService;

    @Override
    @Transactional
    public AadhaarOtpResponse requestAadhaarOtp(AadhaarOtpRequest request) {
        String transactionId = aadhaarService.requestOtp(request.getAadhaarNumber());
        return AadhaarOtpResponse.builder()
                .verificationToken(transactionId)
                .message("OTP sent to the mobile number linked with your Aadhaar. Valid for 10 minutes.")
                .build();
    }

    @Override
    @Transactional
    public AadhaarOtpResponse verifyAadhaarOtp(AadhaarOtpRequest request, String otp) {
        String verificationToken = aadhaarService.verifyOtp(request.getAadhaarNumber(), otp);
        return AadhaarOtpResponse.builder()
                .verificationToken(verificationToken)
                .message("Aadhaar verified successfully. Proceed to registration.")
                .build();
    }

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username is already taken.");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email is already registered.");
        }
        // In production: validate aadhaarVerificationToken from a signed/stored mapping
        // For now: trust non-blank token as proof of Aadhaar verification
        if (request.getAadhaarVerificationToken() == null || request.getAadhaarVerificationToken().isBlank()) {
            throw new AadhaarVerificationException("Aadhaar verification must be completed before registration.");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .mobile(request.getMobile())
                .role(UserRole.TEMPLE_AUTHORITY)  // Self-registration creates TEMPLE_AUTHORITY; SA upgrades if needed
                .mfaType(MfaType.TOTP)            // Default MFA; upgraded by admin
                .aadhaarVerified(true)
                .isActive(false)                  // SA must activate the account
                .build();

        userRepository.save(user);
        log.info("New user registered: id=[{}], role=[{}]", user.getId(), user.getRole());
    }
}
