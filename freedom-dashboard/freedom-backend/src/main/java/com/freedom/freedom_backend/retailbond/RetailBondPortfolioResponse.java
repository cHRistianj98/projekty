package com.freedom.freedom_backend.retailbond;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record RetailBondPortfolioResponse(
        Long assetId,
        String assetName,
        BigDecimal nominalValue,
        BigDecimal grossValue,
        BigDecimal taxableGain,
        BigDecimal taxAmount,
        BigDecimal netValue,
        LocalDate valuationDate,
        List<RetailBondPositionResponse> positions
) {}
