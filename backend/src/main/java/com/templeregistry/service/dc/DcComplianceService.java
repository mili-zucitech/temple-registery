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

    /** Verify ALL employees for a temple in one transaction (module-level action). */
    void verifyStaffModule(Long templeId, DcVerifyRequest req, ScopeHelper.Claims claims);
    /** Flag the Staff module for a temple (sets reason on all employees). */
    void flagStaffModule(Long templeId, DcFlagRequest req, ScopeHelper.Claims claims);

    void verifyContractor(Long id, DcVerifyRequest req, ScopeHelper.Claims claims);
    void flagContractor(Long id, DcFlagRequest req, ScopeHelper.Claims claims);

    /** Verify ALL contractors for a temple in one transaction (module-level action). */
    void verifyContractorsModule(Long templeId, DcVerifyRequest req, ScopeHelper.Claims claims);
    /** Flag the Contractors module for a temple. */
    void flagContractorsModule(Long templeId, DcFlagRequest req, ScopeHelper.Claims claims);
}
