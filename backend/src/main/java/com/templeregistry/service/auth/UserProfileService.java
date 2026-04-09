package com.templeregistry.service.auth;

import com.templeregistry.dto.response.auth.UserProfileResponse;

/**
 * Provides the current authenticated user's profile data plus the TA first-login
 * setup completion checklist (GET /api/auth/me).
 */
public interface UserProfileService {

    /**
     * Returns the profile for the currently authenticated user.
     * For TEMPLE_AUTHORITY users, also returns the module completion checklist.
     */
    UserProfileResponse getCurrentUserProfile();
}
