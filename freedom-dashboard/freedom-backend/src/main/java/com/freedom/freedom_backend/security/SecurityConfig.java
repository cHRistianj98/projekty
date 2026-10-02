package com.freedom.freedom_backend.security;

import jakarta.servlet.DispatcherType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter
            jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter
                    jwtAuthenticationFilter
    ) {
        this.jwtAuthenticationFilter =
                jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain
    securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                .cors(Customizer.withDefaults())

                .csrf(
                        csrf ->
                                csrf.disable()
                )

                .sessionManagement(
                        session ->
                                session.sessionCreationPolicy(
                                        SessionCreationPolicy.STATELESS
                                )
                )

                .exceptionHandling(
                        exceptions -> exceptions
                                .authenticationEntryPoint(
                                        (request, response, authException) -> {
                                            response.setStatus(401);
                                            response.setContentType("application/json");
                                            response.getWriter().write(
                                                    "{\"message\":\"Sesja wygasła lub brak poprawnego tokenu JWT.\"}"
                                            );
                                        }
                                )
                                .accessDeniedHandler(
                                        (request, response, accessDeniedException) -> {
                                            response.setStatus(403);
                                            response.setContentType("application/json");
                                            response.getWriter().write(
                                                    "{\"message\":\"Brak uprawnień do tej operacji.\"}"
                                            );
                                        }
                                )
                )

                .authorizeHttpRequests(
                        auth -> auth
                                // Preserve the original HTTP status when the container renders an error.
                                .dispatcherTypeMatchers(DispatcherType.ERROR)
                                .permitAll()

                                .requestMatchers(
                                        "/api/auth/register",
                                        "/api/auth/login",
                                        "/api/system/health"
                                )
                                .permitAll()

                                .anyRequest()
                                .authenticated()
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}