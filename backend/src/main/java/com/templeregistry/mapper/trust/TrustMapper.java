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
import org.mapstruct.BeanMapping;
import org.mapstruct.Builder;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", imports = TrustStatus.class)
public interface TrustMapper {

    // Trust mappings
    @BeanMapping(builder = @Builder(disableBuilder = true))
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "templeId", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "dissolutionDate", ignore = true)
    @Mapping(target = "dissolutionReason", ignore = true)
    @Mapping(target = "trustRegistrationNumber", ignore = true)
    @Mapping(target = "trustPANNumber", ignore = true)
    @Mapping(target = "bankNameAndBranch", ignore = true)
    @Mapping(target = "systemVerificationStatus", ignore = true)
    @Mapping(target = "sendBackReason", ignore = true)
    Trust fromCreateRequest(CreateTrustRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "templeId", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "trustPANNumber", ignore = true)
    @Mapping(target = "trustRegistrationNumber", ignore = true)
    @Mapping(target = "dissolutionDate", ignore = true)
    @Mapping(target = "dissolutionReason", ignore = true)
    @Mapping(target = "bankNameAndBranch", ignore = true)
    @Mapping(target = "systemVerificationStatus", ignore = true)
    @Mapping(target = "sendBackReason", ignore = true)
    void updateFromRequest(UpdateTrustRequest request, @MappingTarget Trust trust);

    @Mapping(target = "active", expression = "java(trust.getStatus() == TrustStatus.ACTIVE)")
    @Mapping(target = "dissolvedAt", source = "dissolutionDate")
    @Mapping(target = "workflowInstanceId", ignore = true)
    @Mapping(target = "registrationNumber", ignore = true)
    @Mapping(target = "maskedPanNumber", ignore = true)
    @Mapping(target = "maskedBankAccountNumber", ignore = true)
    @Mapping(target = "bankName", ignore = true)
    @Mapping(target = "bankBranch", ignore = true)
    TrustResponse toTrustResponse(Trust trust);

    // Board Member mappings
    @BeanMapping(builder = @Builder(disableBuilder = true))
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "lockVersion", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "trustId", ignore = true)
    @Mapping(target = "aadhaarEncrypted", source = "aadhaarNumber")
    @Mapping(target = "aadhaarHash", ignore = true)
    @Mapping(target = "aadhaarLast4", ignore = true)
    @Mapping(target = "fullName", source = "fullName")
    @Mapping(target = "current", ignore = true)
    @Mapping(target = "verifiedByDc", ignore = true)
    BoardMember fromCreateMemberRequest(CreateBoardMemberRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "trustId", ignore = true)
    @Mapping(target = "appointmentDate", ignore = true)
    @Mapping(target = "tenureEndDate", ignore = true)
    @Mapping(target = "aadhaarEncrypted", ignore = true)
    @Mapping(target = "aadhaarHash", ignore = true)
    @Mapping(target = "aadhaarLast4", ignore = true)
    @Mapping(target = "verifiedByDc", ignore = true)
    void updateMemberFromRequest(UpdateBoardMemberRequest request, @MappingTarget BoardMember member);

    @Mapping(target = "maskedAadhaar", expression = "java(member.getMaskedAadhaar())")
    @Mapping(target = "fullName", source = "fullName")
    BoardMemberResponse toMemberResponse(BoardMember member);
}
