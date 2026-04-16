package com.templeregistry.service.trust;

import com.templeregistry.dto.request.trust.*;
import com.templeregistry.dto.response.trust.*;

import java.util.List;

public interface TrustService {
    // Trust APIs
    TrustResponse createTrust(Long templeId, CreateTrustRequest request);
    List<TrustResponse> getTrustsByTemple(Long templeId);
    TrustResponse updateTrust(Long id, UpdateTrustRequest request);
    TrustResponse dissolveTrust(Long id, DissolveTrustRequest request);

    TrustResponse submitForReview(Long id);

    // Board Member APIs
    BoardMemberResponse addBoardMember(Long trustId, CreateBoardMemberRequest request);
    com.templeregistry.common.PaginatedResponse<BoardMemberResponse> getBoardMembersByTrust(Long trustId, int page, int size);
    BoardMemberResponse updateBoardMember(Long id, UpdateBoardMemberRequest request);
    BoardMemberResponse resignBoardMember(Long id, ResignBoardMemberRequest request);
}
