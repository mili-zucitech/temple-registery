package com.templeregistry.service.dc;

import com.templeregistry.dto.request.dc.FlagTempleProfileRequest;
import com.templeregistry.dto.request.dc.UnflagTempleProfileRequest;
import com.templeregistry.dto.request.dc.VerifyTempleProfileRequest;
import com.templeregistry.dto.response.dc.TempleVerificationResponse;
import com.templeregistry.security.ScopeHelper;

/**
 * Service for DC to verify or flag temple profiles.
 * Provides end-to-end workflow for temple profile verification by District Collector.
 */
public interface DcTempleVerificationService {

    /**
     * Verify a temple profile.
     * Sets verificationStatus = VERIFIED, clears rejection reason.
     * Publishes notification to Temple Authority.
     * Requires DISTRICT_COLLECTOR or SUPER_ADMIN role.
     */
    TempleVerificationResponse verifyTempleProfile(Long templeId, VerifyTempleProfileRequest request, ScopeHelper.Claims claims);

    /**
     * Flag a temple profile for issues.
     * Sets verificationStatus = FLAGGED, records rejection reason.
     * Publishes notification to Temple Authority.
     * Requires DISTRICT_COLLECTOR or SUPER_ADMIN role.
     */
    TempleVerificationResponse flagTempleProfile(Long templeId, FlagTempleProfileRequest request, ScopeHelper.Claims claims);

    /**
     * Remove flag from a temple profile.
     * Sets verificationStatus = UNVERIFIED, clears rejection reason.
     * Does not automatically verify the profile.
     * Publishes notification to Temple Authority.
     * Requires DISTRICT_COLLECTOR or SUPER_ADMIN role.
     */
    TempleVerificationResponse unflagTempleProfile(Long templeId, UnflagTempleProfileRequest request, ScopeHelper.Claims claims);

    /**
     * Get current verification status of a temple.
     * Returns complete verification and flagging information.
     */
    TempleVerificationResponse getVerificationStatus(Long templeId, ScopeHelper.Claims claims);
}
