package com.freedom.freedom_backend.asset;

import java.math.BigDecimal;
import java.time.Instant;

public record AssetResponse(
        Long id,
        String name,
        BigDecimal value,
        String color,
        AssetCategory category,
        String iconKey,
        boolean systemCash,
        Long portfolioId,
        boolean marketPriced,
        MetalSymbol metalSymbol,
        BigDecimal metalQuantity,
        MetalUnit metalUnit,
        BigDecimal marketPriceUsd,
        BigDecimal usdPlnRate,
        Instant marketUpdatedAt
) {
    public static AssetResponse from(Asset a) {
        return new AssetResponse(
                a.getId(),
                a.getName(),
                a.getValue(),
                a.getColor(),
                a.getCategory(),
                a.getIconKey(),
                a.isSystemCash(),
                a.getPortfolioId(),
                a.isMarketPriced(),
                a.getMetalSymbol(),
                a.getMetalQuantity(),
                a.getMetalUnit(),
                a.getMarketPriceUsd(),
                a.getUsdPlnRate(),
                a.getMarketUpdatedAt()
        );
    }
}
