package com.templeregistry.mapper.trust;

import com.templeregistry.dto.request.trust.CreateBoardMemberRequest;
import com.templeregistry.dto.request.trust.CreateTrustRequest;
import com.templeregistry.dto.request.trust.UpdateBoardMemberRequest;
import com.templeregistry.dto.request.trust.UpdateTrustRequest;
import com.templeregistry.dto.response.trust.BoardMemberResponse;
import com.templeregistry.dto.response.trust.TrustResponse;
import com.templeregistry.entity.trust.BoardMember;
import com.templeregistry.entity.trust.TrustRegistration;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface TrustMapper {

    // Trust mappings
    @Mapping(target = "templeId", ignore = true)
    @Mapping(target = "registrationNumber", source = "registrationNumber")
    @Mapping(target = "panNumberEncrypted", source = "panNumber")
    @Mapping(target = "bankAccountNumberEncrypted", source = "bankAccountNumber")
    @Mapping(target = "dcFlagReason", ignore = true)
    @Mapping(target = "version", ignore = true)
    TrustRegistration fromCreateRequest(CreateTrustRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "templeId", ignore = true)
    @Mapping(target = "registrationNumber", source = "trustRegistrationNumber")
    @Mapping(target = "bankName", source = "bankNameAndBranch")
    @Mapping(target = "panNumberEncrypted", ignore = true) // PAN is immutable
    @Mapping(target = "bankBranch", ignore = true)
    @Mapping(target = "dcFlagReason", ignore = true)
    @Mapping(target = "version", ignore = true)
    void updateFromRequest(UpdateTrustRequest request, @MappingTarget TrustRegistration trust);

    @Mapping(target = "registrationNumber", source = "registrationNumber")
    TrustResponse toTrustResponse(TrustRegistration trust);

    // Board Member mappings
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "trustId", ignore = true)
    @Mapping(target = "fullName", source = "fullName")
    BoardMember fromCreateMemberRequest(CreateBoardMemberRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "trustId", ignore = true)
    @Mapping(target = "appointmentDate", ignore = true) // Immutable
    @Mapping(target = "tenureEndDate", ignore = true)
    @Mapping(target = "aadhaarEncrypted", ignore = true)
    void updateMemberFromRequest(UpdateBoardMemberRequest request, @MappingTarget BoardMember member);

    @Mapping(target = "fullName", source = "fullName")
    @Mapping(target = "isCurrent", source = "current")
    BoardMemberResponse toMemberResponse(BoardMember member);
}
