package com.templeregistry.mapper.trust;

import com.templeregistry.dto.request.trust.CreateBoardMemberRequest;
import com.templeregistry.dto.request.trust.CreateTrustRequest;
import com.templeregistry.dto.request.trust.UpdateBoardMemberRequest;
import com.templeregistry.dto.request.trust.UpdateTrustRequest;
import com.templeregistry.dto.response.trust.BoardMemberResponse;
import com.templeregistry.dto.response.trust.TrustResponse;
import com.templeregistry.entity.trust.BoardMember;
import com.templeregistry.entity.trust.Trust;
import com.templeregistry.entity.trust.TrustStatus;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", imports = TrustStatus.class)
public interface TrustMapper {

    // Trust mappings
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "templeId", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "dissolutionDate", ignore = true)
    @Mapping(target = "dissolutionReason", ignore = true)
    Trust fromCreateRequest(CreateTrustRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "templeId", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "trustPANNumber", ignore = true) // PAN is immutable
    @Mapping(target = "dissolutionDate", ignore = true)
    @Mapping(target = "dissolutionReason", ignore = true)
    void updateFromRequest(UpdateTrustRequest request, @MappingTarget Trust trust);

    @Mapping(target = "isActive", expression = "java(trust.getStatus() == TrustStatus.ACTIVE)")
    @Mapping(target = "dissolvedAt", source = "dissolutionDate")
    TrustResponse toTrustResponse(Trust trust);

    // Board Member mappings
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "trustId", ignore = true)
    @Mapping(target = "aadhaarEncrypted", source = "aadhaarNumber")
    @Mapping(target = "fullName", source = "fullName")
    BoardMember fromCreateMemberRequest(CreateBoardMemberRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "trustId", ignore = true)
    @Mapping(target = "appointmentDate", ignore = true) // Immutable
    @Mapping(target = "tenureEndDate", ignore = true)
    @Mapping(target = "aadhaarEncrypted", ignore = true)
    void updateMemberFromRequest(UpdateBoardMemberRequest request, @MappingTarget BoardMember member);

    @Mapping(target = "maskedAadhaar", expression = "java(member.getMaskedAadhaar())")
    @Mapping(target = "fullName", source = "fullName")
    BoardMemberResponse toMemberResponse(BoardMember member);
}
