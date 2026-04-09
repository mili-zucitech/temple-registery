package com.templeregistry.service.auth;

import com.templeregistry.dto.request.auth.*;
import com.templeregistry.dto.response.auth.AuthTokenResponse;
import com.templeregistry.dto.response.auth.MfaChallengeResponse;

public interface AuthService {

    MfaChallengeResponse login(LoginRequest request);

    AuthTokenResponse verifyMfa(MfaVerifyRequest request);

    AuthTokenResponse refresh(RefreshTokenRequest request);

    void logout(String refreshToken);

    void requestPasswordReset(PasswordResetRequest request);

    void confirmPasswordReset(PasswordResetConfirmRequest request);
}
