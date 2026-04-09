package com.templeregistry.service.auth;

import com.templeregistry.dto.request.auth.*;
import com.templeregistry.dto.response.auth.AuthTokenResponse;

public interface AuthService {

    Object login(LoginRequest request);

    AuthTokenResponse verifyMfa(MfaVerifyRequest request);

    AuthTokenResponse refresh(String rawRefreshToken);

    void logout(String rawRefreshToken);

    void requestPasswordReset(PasswordResetRequest request);

    void confirmPasswordReset(PasswordResetConfirmRequest request);
}
