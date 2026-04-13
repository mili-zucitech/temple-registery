package com.templeregistry.service.impl.auth;

import com.templeregistry.dto.request.auth.AadhaarVerifyRequest;
import com.templeregistry.dto.request.auth.CreateAccountRequest;
import com.templeregistry.dto.request.auth.RegistrationInitRequest;
import com.templeregistry.dto.request.auth.TempleRegistrationRequest;
import com.templeregistry.dto.response.auth.AadhaarOtpResponse;
import com.templeregistry.dto.response.auth.CreateAccountResponse;
import com.templeregistry.dto.response.auth.RegistrationInitResponse;
import com.templeregistry.entity.auth.MfaType;
import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.entity.geo.Hobli;
import com.templeregistry.entity.temple.ReligiousTradition;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.TempleGrade;
import com.templeregistry.entity.temple.TempleStatus;
import com.templeregistry.exception.AadhaarVerificationException;
import com.templeregistry.exception.DuplicateResourceException;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.geo.HobliRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.service.auth.AadhaarService;
import com.templeregistry.service.auth.JwtService;
import com.templeregistry.service.auth.RegistrationService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
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

    private static final String CLAIM_REG_PHASE         = "reg_phase";
    private static final String PHASE_AADHAAR_VERIFIED  = "AADHAAR_VERIFIED";

    private final UserRepository     userRepository;
    private final TempleRepository   templeRepository;
    private final HobliRepository    hobliRepository;
    private final PasswordEncoder    passwordEncoder;
    private final AadhaarService     aadhaarService;
    private final JwtService         jwtService;

    // ── Step 1 ────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public RegistrationInitResponse initRegistration(RegistrationInitRequest request) {
        return aadhaarService.initRegistration(request);
    }

    // ── Step 2 ────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public AadhaarOtpResponse verifyAadhaar(AadhaarVerifyRequest request) {
        return aadhaarService.verifyAadhaar(request);
    }

    // ── Step 3 ────────────────────────────────────────────────────────────────

    /**
     * Atomically creates the User and Temple, links them, and returns the userId.
     * Rollback occurs on any failure — no orphaned records.
     */
    @Override
    @Transactional
    public CreateAccountResponse createAccount(CreateAccountRequest request) {
        // 1. Validate the AADHAAR_VERIFIED temp token
        validateAadhaarVerifiedToken(request.getTempToken());

        // 2. Uniqueness guards
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username is already taken.");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email address is already registered.");
        }

        // 3. Resolve geo hierarchy (validates hobli FK and loads district/taluk in one query)
        TempleRegistrationRequest templeReq = request.getTemple();
        Hobli hobli = hobliRepository.findWithGeoById(templeReq.getHobliId())
                .orElseThrow(() -> new EntityNotFoundException("Hobli", templeReq.getHobliId()));
        Long talukId    = hobli.getTaluk().getId();
        Long districtId = hobli.getTaluk().getDistrict().getId();

        // 4. Create User (isActive=false; SA must activate after reviewing the registration)
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .mobile(request.getMobile())
                .role(UserRole.TEMPLE_AUTHORITY)
                .mfaType(MfaType.NONE)
                .aadhaarVerified(true)
                .isActive(false)
                .failedLoginCount(0)
                .build();
        userRepository.save(user);

        // 5. Fix self-referential audit fields (created_by / updated_by cannot be set before the PK is known)
        userRepository.updateSelfAuditFields(user.getId());

        // 6. Create Temple with a system-generated registration number
        String registrationNumber = generateRegistrationNumber(templeReq.getGrade(), templeReq.getHobliId());
        Temple temple = Temple.builder()
                .registrationNumber(registrationNumber)
                .name(templeReq.getName())
                .aliasName(templeReq.getAliasName())
                .primaryDeity(templeReq.getDeityName())
                .grade(TempleGrade.valueOf(templeReq.getGrade()))
                .tradition(ReligiousTradition.valueOf(templeReq.getReligiousTradition()))
                .hobliId(templeReq.getHobliId())
                .talukId(talukId)
                .districtId(districtId)
                .doorNumber(templeReq.getAddressLine1())
                .pinCode(templeReq.getPincode())
                .latitude(templeReq.getGpsLatitude())
                .longitude(templeReq.getGpsLongitude())
                .trustRegistered(false)
                .status(TempleStatus.ACTIVE)
                .build();
        templeRepository.save(temple);

        // 7. Link the temple to the user in a single UPDATE (avoids reload)
        userRepository.linkTemple(user.getId(), temple.getId());

        log.info("New TEMPLE_AUTHORITY registered: userId=[{}], templeId=[{}], registrationNumber=[{}]",
                user.getId(), temple.getId(), registrationNumber);

        return CreateAccountResponse.builder()
                .userId(user.getId())
                .message("Account created. Awaiting Super Admin activation.")
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void validateAadhaarVerifiedToken(String tempToken) {
        Claims claims;
        try {
            claims = jwtService.validateAndParse(tempToken);
        } catch (JwtException | IllegalArgumentException ex) {
            throw new AadhaarVerificationException("Registration token is invalid or has expired. Please restart registration.");
        }
        String phase = claims.get(CLAIM_REG_PHASE, String.class);
        if (!PHASE_AADHAAR_VERIFIED.equals(phase)) {
            throw new AadhaarVerificationException("Aadhaar must be verified before account creation.");
        }
    }

    /**
     * Generates a unique registration number in the format KA-{grade}-{hobliId}-{UUID8}.
     * Example: KA-A-1-3F7B2A1C
     */
    private static String generateRegistrationNumber(String grade, Long hobliId) {
        String uuid8 = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "KA-" + grade + "-" + hobliId + "-" + uuid8;
    }
}
