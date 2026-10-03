package com.freedom.freedom_backend.retailbond;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RetailBondPositionResponse(
        Long id,
        String emissionCode,
        int quantity,
        int availableQuantity,
        int blockedQuantity,
        BigDecimal nominalValue,
        BigDecimal currentGrossValue,
        BigDecimal taxableGain,
        BigDecimal taxAmount,
        BigDecimal currentNetValue,
        BigDecimal earlyRedemptionFeePerBond,
        BigDecimal earlyRedemptionFee,
        BigDecimal earlyRedemptionTaxAmount,
        BigDecimal currentRedemptionValue,
        BigDecimal currentRedemptionPricePerBond,
        LocalDate purchaseDate,
        LocalDate maturityDate,
        LocalDate valuationDate,
        BigDecimal currentRate,
        Integer currentPeriod,
        String source
) {}
