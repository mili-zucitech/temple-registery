package com.templeregistry.mapper.geo;

import com.templeregistry.dto.response.geo.*;
import com.templeregistry.entity.geo.*;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface GeoMapper {

    StateResponse toStateResponse(State entity);

    @Mapping(target = "stateId", source = "state.id")
    CityResponse toCityResponse(City entity);

    @Mapping(target = "cityId", source = "city.id")
    DistrictResponse toDistrictResponse(District entity);

    @Mapping(target = "districtId", source = "district.id")
    TalukResponse toTalukResponse(Taluk entity);

    @Mapping(target = "talukId", source = "taluk.id")
    HobliResponse toHobliResponse(Hobli entity);
}
