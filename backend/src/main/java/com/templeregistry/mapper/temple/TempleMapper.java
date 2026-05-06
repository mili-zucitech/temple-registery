package com.templeregistry.mapper.temple;

import com.templeregistry.dto.response.temple.TempleResponse;
import com.templeregistry.dto.response.temple.TempleSearchResultResponse;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.TempleSearchSummary;
import org.mapstruct.BeanMapping;
import org.mapstruct.Builder;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TempleMapper {

    @BeanMapping(builder = @Builder(disableBuilder = true))
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "trustRegistered", ignore = true)
    @Mapping(target = "assetDeclarationStatus", ignore = true)
    @Mapping(target = "photoUrl", ignore = true)
    @Mapping(target = "hobli", ignore = true)
    @Mapping(target = "website", ignore = true)
    @Mapping(target = "linkedInstitutions", ignore = true)
    @Mapping(target = "annualFestivals", ignore = true)
    @Mapping(target = "landmark", ignore = true)
    @Mapping(target = "historicalSignificance", ignore = true)
    @Mapping(target = "bankName", ignore = true)
    @Mapping(target = "bankIfsc", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "verificationStatus", ignore = true)
    @Mapping(target = "dcRejectionReason", ignore = true)
    Temple fromCreateRequest(com.templeregistry.dto.request.temple.CreateTempleRequest request);

    TempleResponse toTempleResponse(Temple entity);

    @Mapping(target = "id", source = "templeId")
    @Mapping(target = "grade", source = "grade")
    TempleSearchResultResponse toSearchResult(TempleSearchSummary summary);
}
