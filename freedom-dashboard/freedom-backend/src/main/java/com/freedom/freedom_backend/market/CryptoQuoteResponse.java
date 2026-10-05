package com.freedom.freedom_backend.market;

import java.math.BigDecimal;
import java.time.Instant;

public record CryptoQuoteResponse(
        String coinId,
        String symbol,
        String name,
        BigDecimal pricePln,
        BigDecimal priceUsd,
        BigDecimal change24h,
        BigDecimal change1m,
        Instant updatedAt,
        String source
) {}
