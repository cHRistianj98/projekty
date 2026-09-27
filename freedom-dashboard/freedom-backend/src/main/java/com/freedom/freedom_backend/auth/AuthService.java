package com.freedom.freedom_backend.auth;

import com.freedom.freedom_backend.security.JwtService;
import com.freedom.freedom_backend.user.User;
import com.freedom.freedom_backend.user.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository =
                userRepository;

        this.passwordEncoder =
                passwordEncoder;

        this.jwtService =
                jwtService;
    }

    @Transactional
    public RegisterResponse register(
            RegisterRequest request
    ) {

        String normalizedEmail =
                normalizeEmail(
                        request.email()
                );

        if (
                userRepository.existsByEmail(
                        normalizedEmail
                )
        ) {
            throw new EmailAlreadyExistsException(
                    normalizedEmail
            );
        }

        String passwordHash =
                passwordEncoder.encode(
                        request.password()
                );

        User user = new User(
                normalizedEmail,
                passwordHash
        );

        User savedUser =
                userRepository.save(user);

        return new RegisterResponse(
                savedUser.getId(),
                savedUser.getEmail()
        );
    }

    @Transactional(readOnly = true)
    public LoginResponse login(
            LoginRequest request
    ) {

        String normalizedEmail =
                normalizeEmail(
                        request.email()
                );

        User user =
                userRepository
                        .findByEmail(
                                normalizedEmail
                        )
                        .orElseThrow(
                                InvalidCredentialsException::new
                        );

        boolean passwordMatches =
                passwordEncoder.matches(
                        request.password(),
                        user.getPasswordHash()
                );

        if (!passwordMatches) {
            throw new InvalidCredentialsException();
        }

        String token =
                jwtService.generateToken(user);

        return new LoginResponse(
                token,
                "Bearer",
                user.getId(),
                user.getEmail()
        );
    }

    private String normalizeEmail(
            String email
    ) {
        return email
                .trim()
                .toLowerCase();
    }
}