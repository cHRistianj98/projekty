package com.freedom.freedom_backend.market;

import com.freedom.freedom_backend.asset.MetalSymbol;

import java.math.BigDecimal;
import java.time.Instant;

public record MetalQuoteResponse(
        MetalSymbol symbol,
        String name,
        BigDecimal priceUsdPerTroyOunce,
        BigDecimal usdPlnRate,
        BigDecimal pricePlnPerTroyOunce,
        Instant metalUpdatedAt,
        String fxDate
) {}
