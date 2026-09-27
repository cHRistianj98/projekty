package com.freedom.freedom_backend.auth;

public record CurrentUserResponse(
        Long id,
        String email
) {
}