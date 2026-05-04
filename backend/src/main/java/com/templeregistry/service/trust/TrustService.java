package com.templeregistry.service.trust;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.trust.*;
import com.templeregistry.dto.response.trust.*;
import com.templeregistry.security.ScopeHelper;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface TrustService {
    List<TrustResponse> listByTemple(Long templeId);
    TrustResponse create(Long templeId, CreateTrustRequest request);
    TrustResponse getById(Long id);
    TrustResponse update(Long id, UpdateTrustRequest request);

    BoardMemberGroupResponse listBoardMembers(Long trustId, Boolean currentOnly);
    BoardMemberResponse addBoardMember(Long trustId, CreateBoardMemberRequest request);
    BoardMemberResponse updateBoardMember(Long trustId, Long memberId, UpdateBoardMemberRequest request);
    void deleteBoardMember(Long trustId, Long memberId);
    void deleteTrust(Long id);

    // DC board member governance actions
    BoardMemberResponse approveBoardMember(Long trustId, Long memberId, String remarks, ScopeHelper.Claims claims);
    BoardMemberResponse rejectBoardMember(Long trustId, Long memberId, String reason, ScopeHelper.Claims claims);

    void submitFinancial(Long trustId, SubmitTrustFinancialRequest request);
    List<TrustFinancialResponse> listFinancials(Long trustId);

    BoardMeetingResponse createBoardMeeting(Long trustId, CreateBoardMeetingRequest request);
    PaginatedResponse<BoardMeetingResponse> listBoardMeetings(Long trustId, int page, int size);
    BoardMeetingResponse getBoardMeeting(Long trustId, Long meetingId);
    BoardMeetingResponse uploadMeetingMinutes(Long trustId, Long meetingId, MultipartFile file);
    Resource downloadMeetingMinutes(Long trustId, Long meetingId);
}
