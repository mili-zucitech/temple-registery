package com.templeregistry.service.dc;

import com.templeregistry.dto.request.dc.DcFlagRequest;
import com.templeregistry.dto.request.dc.DcVerifyRequest;
import com.templeregistry.security.ScopeHelper;

/**
 * DC compliance actions for governed modules: Temple and Trust only.
 *
 * Staff (Employee) and Contractor modules have NO DC approval or verification workflow.
 * Changes to those modules are effective immediately on TA save.
 */
public interface DcComplianceService {
    void verifyTemple(Long id, DcVerifyRequest req, ScopeHelper.Claims claims);
    void flagTemple(Long id, DcFlagRequest req, ScopeHelper.Claims claims);

    void verifyTrust(Long id, DcVerifyRequest req, ScopeHelper.Claims claims);
    void flagTrust(Long id, DcFlagRequest req, ScopeHelper.Claims claims);
}
