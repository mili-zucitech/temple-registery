package com.templeregistry.service.impl.dc;

import com.templeregistry.dto.response.dc.TempleFullProfileResponse;
import com.templeregistry.entity.geo.City;
import com.templeregistry.entity.geo.District;
import com.templeregistry.entity.geo.Hobli;
import com.templeregistry.entity.geo.Taluk;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.TempleGrade;
import com.templeregistry.entity.temple.TempleSearchSummary;
import com.templeregistry.entity.temple.TempleStatus;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.contractor.ContractorRepository;
import com.templeregistry.repository.dc.*;
import com.templeregistry.repository.declaration.DeclarationClarificationRepository;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.employee.EmployeeRepository;
import com.templeregistry.repository.geo.CityRepository;
import com.templeregistry.repository.temple.TempleProfileStagingRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.repository.temple.TempleSearchSummaryRepository;
import com.templeregistry.repository.trust.BoardMemberRepository;
import com.templeregistry.repository.trust.TrustFinancialRepository;
import com.templeregistry.repository.trust.TrustRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import org.springframework.data.domain.PageImpl;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DcTempleProfileServiceImplTest {

    // ── Repositories ──────────────────────────────────────────────────────────
    @Mock private TempleRepository templeRepository;
    @Mock private TempleSearchSummaryRepository summaryRepository;
    @Mock private TrustRepository trustRepository;
    @Mock private BoardMemberRepository boardMemberRepository;
    @Mock private TrustFinancialRepository trustFinancialRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private ContractorRepository contractorRepository;
    @Mock private DeclarationRepository declarationRepository;
    @Mock private DeclarationClarificationRepository clarificationRepository;
    @Mock private TempleProfileCurrentRepository profileCurrentRepository;
    @Mock private TempleProfileStagingRepository profileStagingRepository;
    @Mock private DeclImmovAgriLandRepository agriLandRepository;
    @Mock private DeclImmovBuildingRepository buildingRepository;
    @Mock private DeclImmovLeasedRepository leasedRepository;
    @Mock private DeclImmovOtherRepository otherImmovRepository;
    @Mock private DeclMovPreciousMetalRepository preciousMetalRepository;
    @Mock private DeclMovArtifactRepository artifactRepository;
    @Mock private DeclMovVehicleRepository vehicleRepository;
    @Mock private DeclMovEquipmentRepository equipmentRepository;
    @Mock private CityRepository cityRepository;
    @Mock private JurisdictionGuard jurisdictionGuard;

    @InjectMocks
    private DcTempleProfileServiceImpl service;

    // ── Shared test data ──────────────────────────────────────────────────────

    private final ScopeHelper.Claims SUPER_ADMIN_CLAIMS =
            new ScopeHelper.Claims(1L, RoleConstants.SUPER_ADMIN, null, null, "admin");

    private final ScopeHelper.Claims DC_CLAIMS =
            new ScopeHelper.Claims(2L, RoleConstants.DISTRICT_COLLECTOR, 10L, null, "dc");

    // ── Helper builders ───────────────────────────────────────────────────────

    private Temple templeWithFullGeo() {
        District district = District.builder().name("Mysuru").build();
        district.setId(10L);

        Taluk taluk = Taluk.builder().district(district).name("Mysuru Taluk").build();
        taluk.setId(20L);

        Hobli hobli = Hobli.builder().taluk(taluk).name("Alanahalli Hobli").build();
        hobli.setId(30L);

        return Temple.builder()
                .registrationNumber("KA-MYS-001")
                .name("Sri Chamundeshwari Temple")
                .grade(TempleGrade.A)
                .primaryDeity("Chamundeshwari")
                .hobliId(30L)
                .hobli(hobli)
                .talukId(20L)
                .districtId(10L)
                .status(TempleStatus.ACTIVE)
                .build();
    }

    private Temple templeWithoutHobli() {
        return Temple.builder()
                .registrationNumber("KA-MYS-002")
                .name("Sri Venkataramana Temple")
                .grade(TempleGrade.B)
                .primaryDeity("Venkataramana")
                .hobliId(null)
                .hobli(null)
                .districtId(10L)
                .status(TempleStatus.ACTIVE)
                .build();
    }

    private Temple templeWithHobliButNoTaluk() {
        Hobli hobliNoTaluk = Hobli.builder().name("Orphan Hobli").build();
        hobliNoTaluk.setId(99L);

        return Temple.builder()
                .registrationNumber("KA-MYS-003")
                .name("Sri Someswara Temple")
                .grade(TempleGrade.C)
                .primaryDeity("Someswara")
                .hobliId(99L)
                .hobli(hobliNoTaluk)
                .districtId(10L)
                .status(TempleStatus.ACTIVE)
                .build();
    }

    private Temple templeWithTalukButNoDistrict() {
        Taluk talukNoDistrict = Taluk.builder().name("Orphan Taluk").build();
        talukNoDistrict.setId(88L);

        Hobli hobli = Hobli.builder().taluk(talukNoDistrict).name("Good Hobli").build();
        hobli.setId(77L);

        return Temple.builder()
                .registrationNumber("KA-MYS-004")
                .name("Sri Brahmi Temple")
                .grade(TempleGrade.B)
                .primaryDeity("Brahmi")
                .hobliId(77L)
                .hobli(hobli)
                .districtId(10L)
                .status(TempleStatus.ACTIVE)
                .build();
    }

    private void stubMinimumForGetFullProfile(Temple temple) {
        when(templeRepository.findWithGeoById(temple.getId())).thenReturn(Optional.of(temple));
        when(trustRepository.findAllByTempleId(temple.getId())).thenReturn(List.of());
        when(employeeRepository.findAllByTempleId(eq(temple.getId()), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of()));
        when(contractorRepository.findAllByTempleId(eq(temple.getId()), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of()));
        when(declarationRepository.findAllByTempleId(eq(temple.getId()), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of()));
        when(profileCurrentRepository.findByTempleId(temple.getId())).thenReturn(Optional.empty());
    }

    // ── Test: full geo data ───────────────────────────────────────────────────

    @Test
    void should_returnFullProfile_when_templeHasCompleteGeoAndCityData() {
        Temple temple = templeWithFullGeo();
        temple.setId(1L);
        stubMinimumForGetFullProfile(temple);

        City city = City.builder().name("Mysuru Division").build();
        TempleSearchSummary summary = TempleSearchSummary.builder()
                .templeId(1L).cityId(5L).build();
        when(summaryRepository.findByTempleId(1L)).thenReturn(Optional.of(summary));
        when(cityRepository.findById(5L)).thenReturn(Optional.of(city));

        TempleFullProfileResponse result = service.getFullProfile(1L, SUPER_ADMIN_CLAIMS);

        assertThat(result.getHobliName()).isEqualTo("Alanahalli Hobli");
        assertThat(result.getTalukName()).isEqualTo("Mysuru Taluk");
        assertThat(result.getDistrictName()).isEqualTo("Mysuru");
        assertThat(result.getCityName()).isEqualTo("Mysuru Division");
        assertThat(result.getTemple()).isNotNull();
        assertThat(result.getTemple().getName()).isEqualTo("Sri Chamundeshwari Temple");
    }

    @Test
    void should_enforceDistrictScope_when_roleIsDc() {
        Temple temple = templeWithFullGeo();
        temple.setId(7L);
        stubMinimumForGetFullProfile(temple);
        when(summaryRepository.findByTempleId(7L)).thenReturn(Optional.empty());

        service.getFullProfile(7L, DC_CLAIMS);

        verify(jurisdictionGuard).assertDistrictScope(eq(temple), eq(DC_CLAIMS));
    }

    // ── Test: hobli is null (partial geo) ────────────────────────────────────

    @Test
    void should_returnPartialProfile_when_hobliIsNull() {
        Temple temple = templeWithoutHobli();
        temple.setId(2L);
        stubMinimumForGetFullProfile(temple);
        when(summaryRepository.findByTempleId(2L)).thenReturn(Optional.empty());

        TempleFullProfileResponse result = service.getFullProfile(2L, SUPER_ADMIN_CLAIMS);

        assertThat(result.getHobliName()).isNull();
        assertThat(result.getTalukName()).isNull();
        assertThat(result.getDistrictName()).isNull();
        assertThat(result.getCityName()).isNull();
        assertThat(result.getTemple()).isNotNull();
    }

    // ── Test: hobli present, taluk is null ────────────────────────────────────

    @Test
    void should_returnPartialProfile_when_talukIsNull() {
        Temple temple = templeWithHobliButNoTaluk();
        temple.setId(3L);
        stubMinimumForGetFullProfile(temple);
        when(summaryRepository.findByTempleId(3L)).thenReturn(Optional.empty());

        TempleFullProfileResponse result = service.getFullProfile(3L, SUPER_ADMIN_CLAIMS);

        assertThat(result.getHobliName()).isEqualTo("Orphan Hobli");
        assertThat(result.getTalukName()).isNull();
        assertThat(result.getDistrictName()).isNull();
    }

    // ── Test: taluk present, district is null ─────────────────────────────────

    @Test
    void should_returnPartialProfile_when_districtIsNull() {
        Temple temple = templeWithTalukButNoDistrict();
        temple.setId(4L);
        stubMinimumForGetFullProfile(temple);
        when(summaryRepository.findByTempleId(4L)).thenReturn(Optional.empty());

        TempleFullProfileResponse result = service.getFullProfile(4L, SUPER_ADMIN_CLAIMS);

        assertThat(result.getHobliName()).isEqualTo("Good Hobli");
        assertThat(result.getTalukName()).isEqualTo("Orphan Taluk");
        assertThat(result.getDistrictName()).isNull();
    }

    // ── Test: null city_id in search summary (the primary 500 bug) ───────────

    @Test
    void should_returnProfileWithNullCityName_when_cityIdIsNullInSearchSummary() {
        Temple temple = templeWithFullGeo();
        temple.setId(5L);
        stubMinimumForGetFullProfile(temple);

        // Summary row exists but city_id is NULL — this caused IllegalArgumentException before the fix
        TempleSearchSummary summaryWithNullCity = TempleSearchSummary.builder()
                .templeId(5L)
                .cityId(null)
                .build();
        when(summaryRepository.findByTempleId(5L)).thenReturn(Optional.of(summaryWithNullCity));

        // Should NOT throw — cityRepository.findById must never be called with null
        TempleFullProfileResponse result = service.getFullProfile(5L, SUPER_ADMIN_CLAIMS);

        assertThat(result.getCityName()).isNull();
        assertThat(result.getTemple()).isNotNull();
    }

    // ── Test: no search summary row at all ───────────────────────────────────

    @Test
    void should_returnProfileWithNullCityName_when_searchSummaryAbsent() {
        Temple temple = templeWithFullGeo();
        temple.setId(6L);
        stubMinimumForGetFullProfile(temple);
        when(summaryRepository.findByTempleId(6L)).thenReturn(Optional.empty());

        TempleFullProfileResponse result = service.getFullProfile(6L, SUPER_ADMIN_CLAIMS);

        assertThat(result.getCityName()).isNull();
    }

    // ── Test: temple not found ────────────────────────────────────────────────

    @Test
    void should_throwEntityNotFoundException_when_templeDoesNotExist() {
        when(templeRepository.findWithGeoById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getFullProfile(999L, SUPER_ADMIN_CLAIMS))
                .isInstanceOf(EntityNotFoundException.class);
    }
}
