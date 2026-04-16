package com.templeregistry.service.dc;

import com.templeregistry.dto.request.dc.DcFlagRequest;
import com.templeregistry.dto.request.dc.DcVerifyRequest;
import com.templeregistry.security.ScopeHelper;

public interface DcComplianceService {
    void verifyTemple(Long id, DcVerifyRequest req, ScopeHelper.Claims claims);
    void flagTemple(Long id, DcFlagRequest req, ScopeHelper.Claims claims);

    void verifyTrust(Long id, DcVerifyRequest req, ScopeHelper.Claims claims);
    void flagTrust(Long id, DcFlagRequest req, ScopeHelper.Claims claims);

    void verifyEmployee(Long id, DcVerifyRequest req, ScopeHelper.Claims claims);
    void flagEmployee(Long id, DcFlagRequest req, ScopeHelper.Claims claims);

    void verifyContractor(Long id, DcVerifyRequest req, ScopeHelper.Claims claims);
    void flagContractor(Long id, DcFlagRequest req, ScopeHelper.Claims claims);
}
