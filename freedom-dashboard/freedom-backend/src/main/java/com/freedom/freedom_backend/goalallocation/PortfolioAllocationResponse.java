package com.freedom.freedom_backend.goalallocation;

import java.math.BigDecimal;

public record PortfolioAllocationResponse(
        Long goalId,
        String goalName,
        Long assetId,
        String assetName,
        BigDecimal amount,
        String sourceType,
        Long portfolioId,
        String portfolioName
) {}
