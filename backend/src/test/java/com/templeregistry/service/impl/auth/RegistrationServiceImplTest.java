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
import com.templeregistry.entity.geo.District;
import com.templeregistry.entity.geo.Hobli;
import com.templeregistry.entity.geo.Taluk;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.exception.AadhaarVerificationException;
import com.templeregistry.exception.DuplicateResourceException;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.geo.HobliRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.service.auth.AadhaarService;
import com.templeregistry.service.auth.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RegistrationServiceImplTest {

    @Mock UserRepository     userRepository;
    @Mock TempleRepository   templeRepository;
    @Mock HobliRepository    hobliRepository;
    @Mock PasswordEncoder    passwordEncoder;
    @Mock AadhaarService     aadhaarService;
    @Mock JwtService         jwtService;

    @InjectMocks RegistrationServiceImpl registrationService;

    // ────────────────────────────────────────────────────────────────────────
    // Step 1: initRegistration
    // ────────────────────────────────────────────────────────────────────────

    @Test
    void should_returnTempToken_when_validAadhaarAndMobile() {
        RegistrationInitRequest request = mockInitRequest("123412341234", "9876543210");
        RegistrationInitResponse expected = RegistrationInitResponse.builder()
                .tempToken("tok-123")
                .maskedAadhaar("XXXX-XXXX-1234")
                .message("OTP sent.")
                .build();
        when(aadhaarService.initRegistration(request)).thenReturn(expected);

        RegistrationInitResponse result = registrationService.initRegistration(request);

        assertThat(result.getTempToken()).isEqualTo("tok-123");
        assertThat(result.getMaskedAadhaar()).isEqualTo("XXXX-XXXX-1234");
        verify(aadhaarService).initRegistration(request);
    }

    @Test
    void should_throwAadhaarVerificationException_when_aadhaarServiceRejects() {
        RegistrationInitRequest request = mockInitRequest("000000000000", "9876543210");
        when(aadhaarService.initRegistration(request))
                .thenThrow(new AadhaarVerificationException("Aadhaar verification service unavailable."));

        assertThatThrownBy(() -> registrationService.initRegistration(request))
                .isInstanceOf(AadhaarVerificationException.class);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Step 2: verifyAadhaar
    // ────────────────────────────────────────────────────────────────────────

    @Test
    void should_returnVerifiedToken_when_correctOtp() {
        AadhaarVerifyRequest request = mockVerifyRequest("123412341234", "999999", "tok-init");
        AadhaarOtpResponse expected = AadhaarOtpResponse.builder()
                .verificationToken("tok-verified")
                .message("Aadhaar verified.")
                .build();
        when(aadhaarService.verifyAadhaar(request)).thenReturn(expected);

        AadhaarOtpResponse result = registrationService.verifyAadhaar(request);

        assertThat(result.getVerificationToken()).isEqualTo("tok-verified");
    }

    @Test
    void should_throwAadhaarVerificationException_when_wrongOtp() {
        AadhaarVerifyRequest request = mockVerifyRequest("123412341234", "000000", "tok-init");
        when(aadhaarService.verifyAadhaar(request))
                .thenThrow(new AadhaarVerificationException("Invalid OTP."));

        assertThatThrownBy(() -> registrationService.verifyAadhaar(request))
                .isInstanceOf(AadhaarVerificationException.class)
                .hasMessageContaining("Invalid OTP");
    }

    // ────────────────────────────────────────────────────────────────────────
    // Step 3: createAccount
    // ────────────────────────────────────────────────────────────────────────

    @Test
    void should_createUserAndTemple_when_validCreateAccountRequest() {
        CreateAccountRequest request = mockCreateRequest("valid-token");
        Claims claims = mock(Claims.class);

        when(jwtService.validateAndParse("valid-token")).thenReturn(claims);
        when(claims.get("reg_phase", String.class)).thenReturn("AADHAAR_VERIFIED");
        when(userRepository.existsByUsername("ta_user")).thenReturn(false);
        when(userRepository.existsByEmail("ta@temple.dev")).thenReturn(false);
        when(hobliRepository.findWithGeoById(1L)).thenReturn(Optional.of(buildHobli()));
        when(passwordEncoder.encode("Secure@Pass1")).thenReturn("hashed");

        User savedUser = User.builder()
                .username("ta_user").email("ta@temple.dev")
                .passwordHash("hashed").role(UserRole.TEMPLE_AUTHORITY)
                .mfaType(MfaType.NONE).isActive(false).aadhaarVerified(true).failedLoginCount(0)
                .build();
        // Simulate JPA setting the generated ID
        doAnswer(inv -> { ((User) inv.getArgument(0)).setId(42L); return null; })
                .when(userRepository).save(any(User.class));
        doAnswer(inv -> { ((Temple) inv.getArgument(0)).setId(99L); return null; })
                .when(templeRepository).save(any(Temple.class));

        CreateAccountResponse result = registrationService.createAccount(request);

        assertThat(result.getUserId()).isEqualTo(42L);
        verify(userRepository).updateSelfAuditFields(42L);
        verify(userRepository).linkTemple(42L, 99L);
        verify(templeRepository).save(argThat(t ->
                t.getName().equals("Chamundi Temple") &&
                t.getDistrictId() != null));
    }

    @Test
    void should_throwDuplicateResourceException_when_usernameExists() {
        CreateAccountRequest request = mockCreateRequest("valid-token");
        Claims claims = mock(Claims.class);
        when(jwtService.validateAndParse("valid-token")).thenReturn(claims);
        when(claims.get("reg_phase", String.class)).thenReturn("AADHAAR_VERIFIED");
        when(userRepository.existsByUsername("ta_user")).thenReturn(true);

        assertThatThrownBy(() -> registrationService.createAccount(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Username");
    }

    @Test
    void should_throwDuplicateResourceException_when_emailExists() {
        CreateAccountRequest request = mockCreateRequest("valid-token");
        Claims claims = mock(Claims.class);
        when(jwtService.validateAndParse("valid-token")).thenReturn(claims);
        when(claims.get("reg_phase", String.class)).thenReturn("AADHAAR_VERIFIED");
        when(userRepository.existsByUsername("ta_user")).thenReturn(false);
        when(userRepository.existsByEmail("ta@temple.dev")).thenReturn(true);

        assertThatThrownBy(() -> registrationService.createAccount(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Email");
    }

    @Test
    void should_throwEntityNotFoundException_when_hobliNotFound() {
        CreateAccountRequest request = mockCreateRequest("valid-token");
        Claims claims = mock(Claims.class);
        when(jwtService.validateAndParse("valid-token")).thenReturn(claims);
        when(claims.get("reg_phase", String.class)).thenReturn("AADHAAR_VERIFIED");
        when(userRepository.existsByUsername(any())).thenReturn(false);
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(hobliRepository.findWithGeoById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> registrationService.createAccount(request))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void should_throwAadhaarVerificationException_when_tempTokenPhaseIsNotVerified() {
        CreateAccountRequest request = mockCreateRequest("wrong-phase-token");
        Claims claims = mock(Claims.class);
        when(jwtService.validateAndParse("wrong-phase-token")).thenReturn(claims);
        when(claims.get("reg_phase", String.class)).thenReturn("OTP_SENT"); // wrong phase

        assertThatThrownBy(() -> registrationService.createAccount(request))
                .isInstanceOf(AadhaarVerificationException.class)
                .hasMessageContaining("Aadhaar must be verified");
    }

    @Test
    void should_throwAadhaarVerificationException_when_tempTokenIsExpired() {
        CreateAccountRequest request = mockCreateRequest("expired-token");
        when(jwtService.validateAndParse("expired-token"))
                .thenThrow(mock(ExpiredJwtException.class));

        assertThatThrownBy(() -> registrationService.createAccount(request))
                .isInstanceOf(AadhaarVerificationException.class)
                .hasMessageContaining("invalid or has expired");
    }

    // ────────────────────────────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────────────────────────────

    private RegistrationInitRequest mockInitRequest(String aadhaar, String mobile) {
        RegistrationInitRequest r = mock(RegistrationInitRequest.class);
        when(r.getAadhaar()).thenReturn(aadhaar);
        when(r.getMobile()).thenReturn(mobile);
        return r;
    }

    private AadhaarVerifyRequest mockVerifyRequest(String aadhaar, String otp, String token) {
        AadhaarVerifyRequest r = mock(AadhaarVerifyRequest.class);
        when(r.getAadhaar()).thenReturn(aadhaar);
        when(r.getOtp()).thenReturn(otp);
        when(r.getTempToken()).thenReturn(token);
        return r;
    }

    private CreateAccountRequest mockCreateRequest(String tempToken) {
        CreateAccountRequest r = mock(CreateAccountRequest.class);
        when(r.getTempToken()).thenReturn(tempToken);
        when(r.getUsername()).thenReturn("ta_user");
        when(r.getEmail()).thenReturn("ta@temple.dev");
        when(r.getPassword()).thenReturn("Secure@Pass1");
        when(r.getFullName()).thenReturn("Test Authority");
        when(r.getMobile()).thenReturn("9876543210");

        TempleRegistrationRequest templeReq = mock(TempleRegistrationRequest.class);
        when(templeReq.getHobliId()).thenReturn(1L);
        when(templeReq.getName()).thenReturn("Chamundi Temple");
        when(templeReq.getAliasName()).thenReturn(null);
        when(templeReq.getDeityName()).thenReturn("Chamundeshwari");
        when(templeReq.getGrade()).thenReturn("A");
        when(templeReq.getReligiousTradition()).thenReturn("SHAKTA");
        when(templeReq.getAddressLine1()).thenReturn("Temple Road");
        when(templeReq.getPincode()).thenReturn("570010");
        when(templeReq.getGpsLatitude()).thenReturn(null);
        when(templeReq.getGpsLongitude()).thenReturn(null);
        when(r.getTemple()).thenReturn(templeReq);
        return r;
    }

    private Hobli buildHobli() {
        District district = new District();
        district.setId(1L);

        Taluk taluk = new Taluk();
        taluk.setId(1L);
        taluk.setDistrict(district);

        Hobli hobli = new Hobli();
        hobli.setId(1L);
        hobli.setTaluk(taluk);
        hobli.setName("Chamundi Hobli");
        return hobli;
    }
}
