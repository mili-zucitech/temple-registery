package com.templeregistry.dto.response.auth;

import com.templeregistry.entity.auth.UserRole;
import lombok.Builder;
import lombok.Getter;

/**
 * Response for GET /api/auth/me.
 * Includes profile fields and a first-login setup checklist for TA users.
 */
@Getter
@Builder
public class UserProfileResponse {

    private Long userId;
    private String username;
    private String email;
    private String fullName;
    private String mobile;
    private UserRole role;
    private boolean isActive;
    private Long districtId;
    private Long templeId;
    private boolean aadhaarVerified;

    /** Null for non-TEMPLE_AUTHORITY roles. */
    private TempleCompletionChecklist completionChecklist;

    @Getter
    @Builder
    public static class TempleCompletionChecklist {
        /** Latest staging status label, or null if no profile draft exists. */
        private String templeProfileStatus;
        private boolean trustExists;
        private long employeeCount;
        private long contractorCount;
        /** Latest declaration status, or null if no declaration exists. */
        private String latestDeclarationStatus;
    }
}
