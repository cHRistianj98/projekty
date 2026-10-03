package com.freedom.freedom_backend.asset;

import java.math.BigDecimal;

public record CashReconciliationAssetResponse(
        Long assetId,
        String name,
        BigDecimal value,
        BigDecimal reserved,
        boolean systemCash,
        Long portfolioId
) {}
