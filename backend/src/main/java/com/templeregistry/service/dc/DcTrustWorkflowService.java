package com.templeregistry.service.dc;

import com.templeregistry.dto.response.trust.BoardMemberResponse;
import com.templeregistry.dto.response.trust.TrustResponse;
import com.templeregistry.security.ScopeHelper;

public interface DcTrustWorkflowService {
    TrustResponse approveTrust(Long trustId, ScopeHelper.Claims claims);
    TrustResponse rejectTrust(Long trustId, String reason, ScopeHelper.Claims claims);
    BoardMemberResponse approveBoardMember(Long memberId, ScopeHelper.Claims claims);
    BoardMemberResponse rejectBoardMember(Long memberId, String reason, ScopeHelper.Claims claims);
}
