package com.templeregistry.dto.response.dc;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Response for DC temple verification/flagging actions.
 * Provides complete verification status after the action.
 */
@Getter
@Builder
public class TempleVerificationResponse {

    private Long templeId;
    private String registrationNumber;
    private String templeName;
    
    /** Current verification status: UNVERIFIED, UNDER_REVIEW, VERIFIED, FLAGGED */
    private String verificationStatus;
    
    /** Reason provided by DC for rejection or flagging */
    private String dcRejectionReason;
    
    /** Human-readable confirmation message */
    private String message;
}
