package com.freedom.freedom_backend.liability;

public class LiabilityNotFoundException
        extends RuntimeException {

    public LiabilityNotFoundException(Long id) {
        super(
                "Liability with id "
                        + id
                        + " was not found"
        );
    }
}