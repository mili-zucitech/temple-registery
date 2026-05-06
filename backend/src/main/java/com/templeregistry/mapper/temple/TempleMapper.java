package com.templeregistry.mapper.temple;

import com.templeregistry.dto.response.temple.TempleResponse;
import com.templeregistry.dto.response.temple.TempleSearchResultResponse;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.TempleSearchSummary;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TempleMapper {

    @Mapping(target = "version", ignore = true)
    @Mapping(target = "trustRegistered", ignore = true)
    @Mapping(target = "assetDeclarationStatus", ignore = true)
    @Mapping(target = "photoUrl", ignore = true)
    Temple fromCreateRequest(com.templeregistry.dto.request.temple.CreateTempleRequest request);

    // districtName and cityName are enriched in TempleServiceImpl.enrichTempleResponse;
    // they are not on the Temple entity and must be explicitly ignored here.
    @Mapping(target = "districtName", ignore = true)
    @Mapping(target = "cityName", ignore = true)
    TempleResponse toTempleResponse(Temple entity);

    @Mapping(target = "id", source = "templeId")
    @Mapping(target = "grade", source = "grade")
    TempleSearchResultResponse toSearchResult(TempleSearchSummary summary);
}
