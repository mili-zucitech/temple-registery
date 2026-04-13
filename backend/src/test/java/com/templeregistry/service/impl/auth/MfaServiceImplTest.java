package com.templeregistry.service.impl.auth;

import com.templeregistry.dto.request.auth.MfaSetupRequest;
import com.templeregistry.dto.request.auth.MfaSetupVerifyRequest;
import com.templeregistry.dto.response.auth.MfaSetupVerifyResponse;
import com.templeregistry.entity.auth.MfaRecoveryCode;
import com.templeregistry.entity.auth.MfaType;
import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.exception.MfaVerificationException;
import com.templeregistry.repository.auth.MfaRecoveryCodeRepository;
import com.templeregistry.repository.auth.UserRepository;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.secret.SecretGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MfaServiceImplTest {

    @Mock UserRepository            userRepository;
    @Mock MfaRecoveryCodeRepository recoveryCodeRepository;
    @Mock CodeVerifier              codeVerifier;
    @Mock SecretGenerator           secretGenerator;

    @InjectMocks MfaServiceImpl mfaService;

    private User taUser;

    @BeforeEach
    void setUp() {
        taUser = User.builder()
                .username("ta_user")
                .email("ta@temple.dev")
                .passwordHash("hash")
                .role(UserRole.TEMPLE_AUTHORITY)
                .mfaType(MfaType.NONE)
                .isActive(false)
                .failedLoginCount(0)
                .build();
        taUser.setId(10L);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Step 4: setupSmsMfa
    // ────────────────────────────────────────────────────────────────────────

    @Test
    void should_storeOtpEntry_when_setupCalledWithValidUser() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(taUser));

        MfaSetupRequest request = mockSetupRequest(10L, "9876543210");
        mfaService.setupSmsMfa(request);

        // Verify an entry was placed in the OTP store
        assertThat(mfaService.otpStore).containsKey(10L);
        assertThat(mfaService.otpStore.get(10L).phone()).isEqualTo("9876543210");
        assertThat(mfaService.otpStore.get(10L).hashedOtp()).isNotBlank();
        assertThat(mfaService.otpStore.get(10L).expiresAt()).isAfter(Instant.now());
    }

    @Test
    void should_throwEntityNotFoundException_when_userNotFound_during_setup() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        MfaSetupRequest request = mockSetupRequest(99L, "9876543210");

        assertThatThrownBy(() -> mfaService.setupSmsMfa(request))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void should_throwMfaVerificationException_when_mfaAlreadyEnabled() {
        taUser.setMfaType(MfaType.SMS_OTP);
        when(userRepository.findById(10L)).thenReturn(Optional.of(taUser));
        MfaSetupRequest request = mockSetupRequest(10L, "9876543210");

        assertThatThrownBy(() -> mfaService.setupSmsMfa(request))
                .isInstanceOf(MfaVerificationException.class)
                .hasMessageContaining("already configured");
    }

    @Test
    void should_throwMfaVerificationException_when_userIsNotTempleAuthority() {
        taUser.setRole(UserRole.SUPER_ADMIN);
        when(userRepository.findById(10L)).thenReturn(Optional.of(taUser));
        MfaSetupRequest request = mockSetupRequest(10L, "9876543210");

        assertThatThrownBy(() -> mfaService.setupSmsMfa(request))
                .isInstanceOf(MfaVerificationException.class)
                .hasMessageContaining("TEMPLE_AUTHORITY");
    }

    // ────────────────────────────────────────────────────────────────────────
    // Step 5: verifyAndEnableMfa
    // ────────────────────────────────────────────────────────────────────────

    @Test
    void should_enableMfaAndReturn8Codes_when_correctOtpProvided() throws Exception {
        // Inject a known OTP entry directly — no reflection on private fields needed
        String knownOtp = "123456";
        String knownHash = sha256Hex(knownOtp);
        mfaService.otpStore.put(10L,
                new MfaServiceImpl.SmsOtpEntry(knownHash, Instant.now().plusSeconds(300), "9876543210"));

        when(userRepository.findById(10L)).thenReturn(Optional.of(taUser));
        when(userRepository.save(any(User.class))).thenReturn(taUser);
        when(recoveryCodeRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        MfaSetupVerifyRequest verifyRequest = mockVerifyRequest(10L, knownOtp);
        MfaSetupVerifyResponse response = mfaService.verifyAndEnableMfa(verifyRequest);

        assertThat(response.getRecoveryCodes()).hasSize(8);
        assertThat(response.getUserId()).isEqualTo(10L);
        assertThat(response.getMessage()).contains("MFA enabled");

        // Verify user was updated with SMS_OTP type and phone
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getMfaType()).isEqualTo(MfaType.SMS_OTP);
        assertThat(userCaptor.getValue().getMfaPhone()).isEqualTo("9876543210");

        // Verify 8 recovery codes were persisted with non-blank hashes
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<MfaRecoveryCode>> codesCaptor =
                ArgumentCaptor.forClass((Class<List<MfaRecoveryCode>>) (Class<?>) List.class);
        verify(recoveryCodeRepository).saveAll(codesCaptor.capture());
        assertThat(codesCaptor.getValue()).hasSize(8);
        codesCaptor.getValue().forEach(c -> assertThat(c.getCodeHash()).isNotBlank());

        // OTP store entry must be cleared after successful verification
        assertThat(mfaService.otpStore).doesNotContainKey(10L);
    }

    @Test
    void should_throwMfaVerificationException_when_otpExpired() {
        // Inject an already-expired entry
        mfaService.otpStore.put(10L,
                new MfaServiceImpl.SmsOtpEntry("somehash", Instant.now().minusSeconds(1), "9876543210"));
        when(userRepository.findById(10L)).thenReturn(Optional.of(taUser));

        MfaSetupVerifyRequest request = mockVerifyRequest(10L, "123456");
        assertThatThrownBy(() -> mfaService.verifyAndEnableMfa(request))
                .isInstanceOf(MfaVerificationException.class)
                .hasMessageContaining("expired");

        // Store entry should be cleared even on expiry
        assertThat(mfaService.otpStore).doesNotContainKey(10L);
    }

    @Test
    void should_throwMfaVerificationException_when_wrongOtpProvided() throws Exception {
        // Inject a valid entry with hash of "123456"
        String correctHash = sha256Hex("123456");
        mfaService.otpStore.put(10L,
                new MfaServiceImpl.SmsOtpEntry(correctHash, Instant.now().plusSeconds(300), "9876543210"));
        when(userRepository.findById(10L)).thenReturn(Optional.of(taUser));

        MfaSetupVerifyRequest request = mockVerifyRequest(10L, "999999"); // intentionally wrong OTP

        assertThatThrownBy(() -> mfaService.verifyAndEnableMfa(request))
                .isInstanceOf(MfaVerificationException.class)
                .hasMessageContaining("Invalid OTP");
    }

    // ────────────────────────────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────────────────────────────

    private MfaSetupRequest mockSetupRequest(Long userId, String phone) {
        MfaSetupRequest r = mock(MfaSetupRequest.class);
        when(r.getUserId()).thenReturn(userId);
        when(r.getPhone()).thenReturn(phone);
        return r;
    }

    private MfaSetupVerifyRequest mockVerifyRequest(Long userId, String otp) {
        MfaSetupVerifyRequest r = mock(MfaSetupVerifyRequest.class);
        when(r.getUserId()).thenReturn(userId);
        when(r.getOtp()).thenReturn(otp);
        return r;
    }

    private static String sha256Hex(String input) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        return HexFormat.of().formatHex(digest.digest(input.getBytes(StandardCharsets.UTF_8)));
    }
}
