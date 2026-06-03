package com.templeregistry.service.dc;

import com.templeregistry.dto.request.dc.DcFlagRequest;
import com.templeregistry.dto.request.dc.DcVerifyRequest;
import com.templeregistry.security.ScopeHelper;

/**
 * DC compliance actions for Temple only.
 *
 * Trust governance is handled exclusively by the GovernanceWorkflow (approveTrust/sendBackTrust/rejectTrust).
 * Staff (Employee) and Contractor modules have NO DC approval or verification workflow.
 */
public interface DcComplianceService {
    void verifyTemple(Long id, DcVerifyRequest req, ScopeHelper.Claims claims);
    void flagTemple(Long id, DcFlagRequest req, ScopeHelper.Claims claims);
}
