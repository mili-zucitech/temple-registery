package com.templeregistry.service.trust;

import com.templeregistry.dto.request.trust.CreateBoardMemberRequest;
import com.templeregistry.dto.request.trust.CreateBoardMeetingRequest;
import com.templeregistry.dto.request.trust.CreateTrustRequest;
import com.templeregistry.dto.request.trust.SubmitTrustFinancialRequest;
import com.templeregistry.dto.request.trust.UpdateBoardMemberRequest;
import com.templeregistry.dto.request.trust.UpdateTrustRequest;
import com.templeregistry.entity.trust.BoardMember;

import java.time.LocalDate;

public interface TrustValidationService {
    void validateTrustRequest(CreateTrustRequest request, Long existingTrustId);
    void validateTrustUpdateRequest(UpdateTrustRequest request, Long existingTrustId);
    void validateBoardMemberCreate(Long trustId, CreateBoardMemberRequest request);
    void validateBoardMemberUpdate(Long trustId, BoardMember member, UpdateBoardMemberRequest request);
    void validateFinancialRequest(Long trustId, SubmitTrustFinancialRequest request);
    void validateBoardMeetingRequest(CreateBoardMeetingRequest request);
    boolean isCurrentMember(LocalDate tenureEndDate);
}
