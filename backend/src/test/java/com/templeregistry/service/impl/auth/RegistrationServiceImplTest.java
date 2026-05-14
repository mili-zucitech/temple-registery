package com.templeregistry.service.impl.auth;

import com.templeregistry.dto.request.auth.CreateAccountRequest;
import com.templeregistry.dto.request.auth.TempleRegistrationRequest;
import com.templeregistry.dto.response.auth.CreateAccountResponse;
import com.templeregistry.entity.auth.MfaType;
import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.entity.geo.District;
import com.templeregistry.entity.geo.Hobli;
import com.templeregistry.entity.geo.Taluk;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.exception.DuplicateResourceException;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.geo.HobliRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.service.temple.TempleSearchSummaryService;
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
    @Mock TempleSearchSummaryService summaryService;

    @InjectMocks RegistrationServiceImpl registrationService;

    // ────────────────────────────────────────────────────────────────────────
    // createAccount Tests
    // ────────────────────────────────────────────────────────────────────────

    @Test
    void should_createUserAndTemple_when_validCreateAccountRequest() {
        CreateAccountRequest request = mockCreateRequest();

        when(userRepository.existsByUsername("ta_user")).thenReturn(false);
        when(userRepository.existsByEmail("ta@temple.dev")).thenReturn(false);
        when(hobliRepository.findWithGeoById(1L)).thenReturn(Optional.of(buildHobli()));
        when(passwordEncoder.encode("Secure@Pass1")).thenReturn("hashed");

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

    // ────────────────────────────────────────────────────────────────────────
    // createAccount — duplicate username
    // ────────────────────────────────────────────────────────────────────────

    @Test
    void should_throwDuplicateResourceException_when_usernameExists() {
        CreateAccountRequest request = mockCreateRequest();
        when(userRepository.existsByUsername("ta_user")).thenReturn(true);

        assertThatThrownBy(() -> registrationService.createAccount(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Username");
    }

    // ────────────────────────────────────────────────────────────────────────
    // createAccount — duplicate email
    // ────────────────────────────────────────────────────────────────────────

    @Test
    void should_throwDuplicateResourceException_when_emailExists() {
        CreateAccountRequest request = mockCreateRequest();
        when(userRepository.existsByUsername("ta_user")).thenReturn(false);
        when(userRepository.existsByEmail("ta@temple.dev")).thenReturn(true);

        assertThatThrownBy(() -> registrationService.createAccount(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Email");
    }

    // ────────────────────────────────────────────────────────────────────────
    // createAccount — hobli not found
    // ────────────────────────────────────────────────────────────────────────

    @Test
    void should_throwEntityNotFoundException_when_hobliNotFound() {
        CreateAccountRequest request = mockCreateRequest();
        when(userRepository.existsByUsername(any())).thenReturn(false);
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(hobliRepository.findWithGeoById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> registrationService.createAccount(request))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("not found");
    }

    // ────────────────────────────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────────────────────────────

    private CreateAccountRequest mockCreateRequest() {
        CreateAccountRequest r = mock(CreateAccountRequest.class);
        when(r.getAadhaar()).thenReturn("123412341234");
        when(r.getUsername()).thenReturn("ta_user");
        when(r.getEmail()).thenReturn("ta@temple.dev");
        when(r.getPassword()).thenReturn("Secure@Pass1");
        when(r.getFullName()).thenReturn("Test Authority");
        when(r.getMobile()).thenReturn("9876543210");
        when(r.getAadhaar()).thenReturn("123412341234");

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
        com.templeregistry.entity.geo.City city = new com.templeregistry.entity.geo.City();
        city.setId(1L);

        District district = new District();
        district.setId(1L);
        district.setCity(city);

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
