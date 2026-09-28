package com.freedom.freedom_backend.liability;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class LiabilityExceptionHandler {

    @ExceptionHandler(
            LiabilityNotFoundException.class
    )
    @ResponseStatus(
            HttpStatus.NOT_FOUND
    )
    public Map<String, Object> handleLiabilityNotFound(
            LiabilityNotFoundException exception
    ) {
        return Map.of(
                "timestamp",
                Instant.now().toString(),

                "status",
                404,

                "error",
                "Not Found",

                "message",
                exception.getMessage()
        );
    }
}