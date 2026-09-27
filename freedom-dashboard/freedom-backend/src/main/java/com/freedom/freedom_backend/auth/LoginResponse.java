package com.freedom.freedom_backend.auth;

public record LoginResponse(
        String token,
        String tokenType,
        Long userId,
        String email
) {
}