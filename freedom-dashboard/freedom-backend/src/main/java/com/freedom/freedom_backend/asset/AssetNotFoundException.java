package com.freedom.freedom_backend.asset;

public class AssetNotFoundException
        extends RuntimeException {

    public AssetNotFoundException(Long id) {
        super(
                "Asset with id "
                        + id
                        + " not found."
        );
    }
}