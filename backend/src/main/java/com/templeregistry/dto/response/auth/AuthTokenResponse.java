package com.templeregistry.dto.response.auth;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthTokenResponse {
    private String accessToken;
    private String refreshToken;
    private long expiresIn;  // seconds until access token expires
    private String role;
    private Long userId;
}
