package com.freedom.freedom_backend.auth;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class AuthExceptionHandler {

    @ExceptionHandler(
            EmailAlreadyExistsException.class
    )
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, Object>
    handleEmailAlreadyExists(
            EmailAlreadyExistsException exception
    ) {
        return Map.of(
                "timestamp",
                Instant.now().toString(),

                "status",
                409,

                "error",
                "Conflict",

                "message",
                exception.getMessage()
        );
    }

    @ExceptionHandler(
            InvalidCredentialsException.class
    )
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public Map<String, Object>
    handleInvalidCredentials(
            InvalidCredentialsException exception
    ) {
        return Map.of(
                "timestamp",
                Instant.now().toString(),

                "status",
                401,

                "error",
                "Unauthorized",

                "message",
                exception.getMessage()
        );
    }
}