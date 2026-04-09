package com.templeregistry.dto.response.auth;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthTokenResponse {
    private String accessToken;
    private String refreshToken;
    private long expiresIn;  // seconds until access token expires
    private String role;
    private Long userId;
}
