package com.freedom.freedom_backend.security;

import com.freedom.freedom_backend.user.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long expirationMinutes;

    public JwtService(
            @Value("${app.jwt.secret}")
            String secret,

            @Value("${app.jwt.expiration-minutes}")
            long expirationMinutes
    ) {
        this.secretKey = Keys.hmacShaKeyFor(
                secret.getBytes(
                        StandardCharsets.UTF_8
                )
        );

        this.expirationMinutes =
                expirationMinutes;
    }

    public String generateToken(
            User user
    ) {
        Instant now =
                Instant.now();

        Instant expiresAt =
                now.plus(
                        expirationMinutes,
                        ChronoUnit.MINUTES
                );

        return Jwts.builder()
                .subject(
                        user.getId().toString()
                )
                .claim(
                        "email",
                        user.getEmail()
                )
                .issuedAt(
                        Date.from(now)
                )
                .expiration(
                        Date.from(expiresAt)
                )
                .signWith(secretKey)
                .compact();
    }

    public Long extractUserId(
            String token
    ) {
        String subject =
                extractClaims(token)
                        .getSubject();

        return Long.valueOf(subject);
    }

    public String extractEmail(
            String token
    ) {
        return extractClaims(token)
                .get(
                        "email",
                        String.class
                );
    }

    public boolean isTokenValid(
            String token
    ) {
        try {
            extractClaims(token);
            return true;
        } catch (Exception exception) {
            return false;
        }
    }

    private Claims extractClaims(
            String token
    ) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}