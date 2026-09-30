package com.freedom.freedom_backend.portfolio;

import java.math.BigDecimal;

public record PortfolioResponse(
        Long id,
        String name,
        PortfolioType type,
        String color,
        String iconKey,
        boolean systemPortfolio,
        BigDecimal grossValue,
        BigDecimal allocatedOut,
        BigDecimal value,
        BigDecimal targetAmount,
        BigDecimal monthlyContribution,
        String imageUrl,
        PortfolioImagePosition imagePosition
) {}
