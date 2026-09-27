package com.freedom.freedom_backend.auth;

public class EmailAlreadyExistsException
        extends RuntimeException {

    public EmailAlreadyExistsException(
            String email
    ) {
        super(
                "User with email "
                        + email
                        + " already exists"
        );
    }
}