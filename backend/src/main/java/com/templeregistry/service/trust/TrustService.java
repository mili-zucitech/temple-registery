package com.templeregistry.service.trust;

import com.templeregistry.dto.request.trust.*;
import com.templeregistry.dto.response.trust.*;

import java.util.List;

public interface TrustService {
    List<TrustResponse> listByTemple(Long templeId);
    TrustResponse create(Long templeId, CreateTrustRequest request);
    TrustResponse getById(Long id);
    TrustResponse update(Long id, CreateTrustRequest request);

    List<BoardMemberResponse> listBoardMembers(Long trustId);
    BoardMemberResponse addBoardMember(Long trustId, CreateBoardMemberRequest request);

    void submitFinancial(Long trustId, SubmitTrustFinancialRequest request);
}
