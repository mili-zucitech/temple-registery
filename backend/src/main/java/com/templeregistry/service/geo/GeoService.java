package com.templeregistry.service.geo;

import com.templeregistry.dto.request.geo.*;
import com.templeregistry.dto.response.geo.*;

import java.util.List;

public interface GeoService {

    List<StateResponse> listStates();
    StateResponse createState(CreateStateRequest request);

    List<CityResponse> listCitiesByState(Long stateId);
    CityResponse createCity(CreateCityRequest request);

    List<DistrictResponse> listDistrictsByCity(Long cityId);
    List<DistrictResponse> listDistrictsByState(Long stateId);
    List<DistrictResponse> listAllDistricts();
    DistrictResponse createDistrict(CreateDistrictRequest request);

    List<TalukResponse> listTaluksByDistrict(Long districtId);
    TalukResponse createTaluk(CreateTalukRequest request);

    List<HobliResponse> listHoblisByTaluk(Long talukId);
    HobliResponse createHobli(CreateHobliRequest request);
}
