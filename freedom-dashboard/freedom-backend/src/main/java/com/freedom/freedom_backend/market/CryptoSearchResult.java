package com.freedom.freedom_backend.market;

public record CryptoSearchResult(
        String id,
        String symbol,
        String name,
        Integer marketCapRank,
        String thumb
) {}
