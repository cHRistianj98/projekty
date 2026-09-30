package com.freedom.freedom_backend.asset;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class RetailBondValuationService {
    public static final BigDecimal BELKA_RATE = new BigDecimal("0.19");

    public BondValuation calculate(BigDecimal purchaseValue, BigDecimal grossValue) {
        if (purchaseValue == null || purchaseValue.signum() <= 0) {
            throw new IllegalArgumentException("Podaj poprawny kapitał początkowy obligacji.");
        }
        if (grossValue == null || grossValue.signum() < 0) {
            throw new IllegalArgumentException("Podaj poprawną bieżącą wartość brutto obligacji.");
        }

        BigDecimal taxableGain = grossValue.subtract(purchaseValue).max(BigDecimal.ZERO);
        BigDecimal taxAmount = taxableGain.multiply(BELKA_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal netValue = grossValue.subtract(taxAmount).setScale(2, RoundingMode.HALF_UP);

        return new BondValuation(
                purchaseValue.setScale(2, RoundingMode.HALF_UP),
                grossValue.setScale(2, RoundingMode.HALF_UP),
                taxableGain.setScale(2, RoundingMode.HALF_UP),
                BELKA_RATE,
                taxAmount,
                netValue
        );
    }

    public record BondValuation(
            BigDecimal purchaseValue,
            BigDecimal grossValue,
            BigDecimal taxableGain,
            BigDecimal taxRate,
            BigDecimal taxAmount,
            BigDecimal netValue
    ) {}
}
