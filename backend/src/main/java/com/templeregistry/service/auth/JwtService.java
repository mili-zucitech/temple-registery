package com.templeregistry.service.auth;

import com.templeregistry.entity.auth.User;
import io.jsonwebtoken.Claims;

public interface JwtService {

    String generateAccessToken(User user);

    String generateTempToken(User user);

    Claims validateAndParse(String token);

    String generateRefreshToken();
}
