package com.templeregistry.service.impl.geo;

import com.templeregistry.dto.request.geo.*;
import com.templeregistry.dto.response.geo.*;
import com.templeregistry.entity.geo.*;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.mapper.geo.GeoMapper;
import com.templeregistry.repository.geo.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

// Request DTOs use @NoArgsConstructor with no setters — use mocks to supply field values

@ExtendWith(MockitoExtension.class)
class GeoServiceImplTest {

    @Mock private StateRepository    stateRepository;
    @Mock private CityRepository     cityRepository;
    @Mock private DistrictRepository districtRepository;
    @Mock private TalukRepository    talukRepository;
    @Mock private HobliRepository    hobliRepository;
    @Mock private GeoMapper          geoMapper;

    @InjectMocks
    private GeoServiceImpl geoService;

    // ── listStates ────────────────────────────────────────────────────────────

    @Test
    void should_returnAllStates_when_listStatesCalled() {
        State s1 = State.builder().id(1L).name("Karnataka").code("KA").build();
        State s2 = State.builder().id(2L).name("Tamil Nadu").code("TN").build();
        StateResponse r1 = StateResponse.builder().id(1L).name("Karnataka").code("KA").build();
        StateResponse r2 = StateResponse.builder().id(2L).name("Tamil Nadu").code("TN").build();
        when(stateRepository.findAll()).thenReturn(List.of(s1, s2));
        when(geoMapper.toStateResponse(s1)).thenReturn(r1);
        when(geoMapper.toStateResponse(s2)).thenReturn(r2);

        List<StateResponse> result = geoService.listStates();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getName()).isEqualTo("Karnataka");
    }

    @Test
    void should_returnEmptyList_when_noStatesExist() {
        when(stateRepository.findAll()).thenReturn(List.of());

        List<StateResponse> result = geoService.listStates();

        assertThat(result).isEmpty();
    }

    // ── createState ───────────────────────────────────────────────────────────

    @Test
    void should_createAndReturnState_when_validRequest() {
        CreateStateRequest req = mock(CreateStateRequest.class);
        when(req.getName()).thenReturn("Maharashtra");
        when(req.getCode()).thenReturn("MH");
        State entity = State.builder().id(3L).name("Maharashtra").code("MH").build();
        StateResponse response = StateResponse.builder().id(3L).name("Maharashtra").code("MH").build();
        when(stateRepository.save(any(State.class))).thenReturn(entity);
        when(geoMapper.toStateResponse(entity)).thenReturn(response);

        StateResponse result = geoService.createState(req);

        assertThat(result.getName()).isEqualTo("Maharashtra");
        assertThat(result.getCode()).isEqualTo("MH");
        verify(stateRepository).save(any(State.class));
    }

    // ── createCity ────────────────────────────────────────────────────────────

    @Test
    void should_createCity_when_stateExists() {
        State state = State.builder().id(1L).name("Karnataka").code("KA").build();
        CreateCityRequest req = mock(CreateCityRequest.class);
        when(req.getStateId()).thenReturn(1L);
        when(req.getName()).thenReturn("Bengaluru");
        City city = City.builder().id(5L).name("Bengaluru").state(state).build();
        CityResponse response = CityResponse.builder().id(5L).name("Bengaluru").stateId(1L).build();
        when(stateRepository.findById(1L)).thenReturn(Optional.of(state));
        when(cityRepository.save(any(City.class))).thenReturn(city);
        when(geoMapper.toCityResponse(city)).thenReturn(response);

        CityResponse result = geoService.createCity(req);

        assertThat(result.getName()).isEqualTo("Bengaluru");
    }

    @Test
    void should_throwEntityNotFoundException_when_stateNotFoundForCity() {
        CreateCityRequest req = mock(CreateCityRequest.class);
        when(req.getStateId()).thenReturn(99L);
        when(stateRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> geoService.createCity(req))
                .isInstanceOf(EntityNotFoundException.class);

        verify(cityRepository, never()).save(any());
    }

    // ── createDistrict ────────────────────────────────────────────────────────

    @Test
    void should_createDistrict_when_cityExists() {
        State state = State.builder().id(1L).name("Karnataka").code("KA").build();
        City city = City.builder().id(5L).name("Bengaluru").state(state).build();
        CreateDistrictRequest req = mock(CreateDistrictRequest.class);
        when(req.getCityId()).thenReturn(5L);
        when(req.getName()).thenReturn("Bengaluru Urban");
        when(req.getCode()).thenReturn("BLR");
        District district = District.builder().id(10L).name("Bengaluru Urban").city(city).build();
        DistrictResponse response = DistrictResponse.builder().id(10L).name("Bengaluru Urban").code("BLR").cityId(5L).build();
        when(cityRepository.findById(5L)).thenReturn(Optional.of(city));
        when(districtRepository.save(any(District.class))).thenReturn(district);
        when(geoMapper.toDistrictResponse(district)).thenReturn(response);

        DistrictResponse result = geoService.createDistrict(req);

        assertThat(result.getName()).isEqualTo("Bengaluru Urban");
    }

    @Test
    void should_throwEntityNotFoundException_when_cityNotFoundForDistrict() {
        CreateDistrictRequest req = mock(CreateDistrictRequest.class);
        when(req.getCityId()).thenReturn(99L);
        when(cityRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> geoService.createDistrict(req))
                .isInstanceOf(EntityNotFoundException.class);

        verify(districtRepository, never()).save(any());
    }

    // ── createTaluk ───────────────────────────────────────────────────────────

    @Test
    void should_createTaluk_when_districtExists() {
        District district = District.builder().id(10L).name("Bengaluru Urban").build();
        CreateTalukRequest req = mock(CreateTalukRequest.class);
        when(req.getDistrictId()).thenReturn(10L);
        when(req.getName()).thenReturn("Anekal");
        Taluk taluk = Taluk.builder().id(20L).name("Anekal").district(district).build();
        TalukResponse response = TalukResponse.builder().id(20L).name("Anekal").districtId(10L).build();
        when(districtRepository.findById(10L)).thenReturn(Optional.of(district));
        when(talukRepository.save(any(Taluk.class))).thenReturn(taluk);
        when(geoMapper.toTalukResponse(taluk)).thenReturn(response);

        TalukResponse result = geoService.createTaluk(req);

        assertThat(result.getName()).isEqualTo("Anekal");
    }

    @Test
    void should_throwEntityNotFoundException_when_districtNotFoundForTaluk() {
        CreateTalukRequest req = mock(CreateTalukRequest.class);
        when(req.getDistrictId()).thenReturn(99L);
        when(districtRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> geoService.createTaluk(req))
                .isInstanceOf(EntityNotFoundException.class);

        verify(talukRepository, never()).save(any());
    }

    // ── listDistrictsByState ──────────────────────────────────────────────────

    @Test
    void should_returnDistrictsByState_when_stateIdProvided() {
        District d = District.builder().id(10L).name("Bengaluru Urban").build();
        DistrictResponse r = DistrictResponse.builder().id(10L).name("Bengaluru Urban").code("BLR").cityId(5L).build();
        when(districtRepository.findAllByCityStateId(1L)).thenReturn(List.of(d));
        when(geoMapper.toDistrictResponse(d)).thenReturn(r);

        List<DistrictResponse> result = geoService.listDistrictsByState(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Bengaluru Urban");
    }
}
