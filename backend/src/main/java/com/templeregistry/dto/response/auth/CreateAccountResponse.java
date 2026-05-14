package com.templeregistry.dto.response.auth;

import lombok.Builder;
import lombok.Getter;

/**
 * Returned from POST /register/create.
 * After successful account + temple creation the caller uses this userId
 * for subsequent /mfa/setup and /mfa/verify calls.
 */
@Getter
@Builder
public class CreateAccountResponse {

    private Long userId;
    private String message;
}
