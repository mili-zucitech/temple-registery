package com.templeregistry.service.impl.geo;

import com.templeregistry.dto.request.geo.*;
import com.templeregistry.dto.response.geo.*;
import com.templeregistry.entity.geo.*;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.mapper.geo.GeoMapper;
import com.templeregistry.repository.geo.*;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.service.geo.GeoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeoServiceImpl implements GeoService {

    private final StateRepository    stateRepository;
    private final CityRepository     cityRepository;
    private final DistrictRepository districtRepository;
    private final TalukRepository    talukRepository;
    private final HobliRepository    hobliRepository;
    private final GeoMapper          geoMapper;

    // ─── States ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<StateResponse> listStates() {
        return stateRepository.findAll().stream().map(geoMapper::toStateResponse).toList();
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional
    public StateResponse createState(CreateStateRequest request) {
        State state = State.builder().name(request.getName()).code(request.getCode()).build();
        State saved = stateRepository.save(state);
        log.info("State created: id=[{}], name=[{}]", saved.getId(), saved.getName());
        return geoMapper.toStateResponse(saved);
    }

    // ─── Cities ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<CityResponse> listCitiesByState(Long stateId) {
        return cityRepository.findAllByStateId(stateId).stream().map(geoMapper::toCityResponse).toList();
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional
    public CityResponse createCity(CreateCityRequest request) {
        State state = stateRepository.findById(request.getStateId())
                .orElseThrow(() -> new EntityNotFoundException("State", request.getStateId()));
        City city = City.builder().state(state).name(request.getName()).build();
        return geoMapper.toCityResponse(cityRepository.save(city));
    }

    // ─── Districts ───────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<DistrictResponse> listDistrictsByCity(Long cityId) {
        return districtRepository.findAllByCityId(cityId).stream().map(geoMapper::toDistrictResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DistrictResponse> listDistrictsByState(Long stateId) {
        return districtRepository.findAllByCityStateId(stateId).stream().map(geoMapper::toDistrictResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DistrictResponse> listAllDistricts() {
        return districtRepository.findAll(org.springframework.data.domain.Sort.by("name")).stream()
                .map(geoMapper::toDistrictResponse).toList();
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional
    public DistrictResponse createDistrict(CreateDistrictRequest request) {
        City city = cityRepository.findById(request.getCityId())
                .orElseThrow(() -> new EntityNotFoundException("City", request.getCityId()));
        District d = District.builder().city(city).name(request.getName()).code(request.getCode()).build();
        return geoMapper.toDistrictResponse(districtRepository.save(d));
    }

    // ─── Taluks ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<TalukResponse> listTaluksByDistrict(Long districtId) {
        return talukRepository.findAllByDistrictId(districtId).stream().map(geoMapper::toTalukResponse).toList();
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional
    public TalukResponse createTaluk(CreateTalukRequest request) {
        District district = districtRepository.findById(request.getDistrictId())
                .orElseThrow(() -> new EntityNotFoundException("District", request.getDistrictId()));
        Taluk t = Taluk.builder().district(district).name(request.getName()).build();
        return geoMapper.toTalukResponse(talukRepository.save(t));
    }

    // ─── Hoblis ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<HobliResponse> listHoblisByTaluk(Long talukId) {
        return hobliRepository.findAllByTalukId(talukId).stream().map(geoMapper::toHobliResponse).toList();
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional
    public HobliResponse createHobli(CreateHobliRequest request) {
        Taluk taluk = talukRepository.findById(request.getTalukId())
                .orElseThrow(() -> new EntityNotFoundException("Taluk", request.getTalukId()));
        Hobli h = Hobli.builder().taluk(taluk).name(request.getName()).build();
        return geoMapper.toHobliResponse(hobliRepository.save(h));
    }
}
