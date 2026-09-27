package com.freedom.freedom_backend.auth;

import com.freedom.freedom_backend.user.User;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(
            AuthService authService
    ) {
        this.authService =
                authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterResponse register(
            @Valid
            @RequestBody
            RegisterRequest request
    ) {
        return authService.register(
                request
        );
    }

    @PostMapping("/login")
    public LoginResponse login(
            @Valid
            @RequestBody
            LoginRequest request
    ) {
        return authService.login(
                request
        );
    }

    @GetMapping("/me")
    public CurrentUserResponse me(
            @AuthenticationPrincipal
            User user
    ) {
        return new CurrentUserResponse(
                user.getId(),
                user.getEmail()
        );
    }
}