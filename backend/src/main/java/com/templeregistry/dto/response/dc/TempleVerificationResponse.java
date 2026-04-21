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
    
    /** True if DC has verified this temple profile */
    private boolean isVerifiedByDc;
    
    /** Timestamp when DC verified the profile */
    private LocalDateTime verifiedByDcAt;
    
    /** User ID of DC who verified */
    private Long verifiedByDcUserId;
    
    /** True if DC has flagged this temple profile for issues */
    private boolean isFlaggedByDc;
    
    /** Timestamp when DC flagged the profile */
    private LocalDateTime flaggedByDcAt;
    
    /** User ID of DC who flagged */
    private Long flaggedByDcUserId;
    
    /** Reason provided by DC for rejection or flagging */
    private String dcRejectionReason;
    
    /** Human-readable confirmation message */
    private String message;
}
