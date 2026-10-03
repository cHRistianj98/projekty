package com.freedom.freedom_backend.retailbond;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Locale;

public enum RetailBondProduct {
    OTS("obligacje-3-miesieczne-ots", 3, 3, false),
    ROR("obligacje-roczne-ror", 12, 1, false),
    DOR("obligacje-2-letnie-dor", 24, 1, false),
    TOS("obligacje-3-letnie-tos", 36, 12, true),
    COI("obligacje-4-letnie-coi", 48, 12, false),
    EDO("obligacje-10-letnie-edo", 120, 12, true),
    ROS("obligacje-6-letnie-ros", 72, 12, true),
    ROD("obligacje-12-letnie-rod", 144, 12, true);

    private final String slug;
    private final int termMonths;
    private final int periodMonths;
    private final boolean capitalizes;

    RetailBondProduct(String slug, int termMonths, int periodMonths, boolean capitalizes) {
        this.slug = slug;
        this.termMonths = termMonths;
        this.periodMonths = periodMonths;
        this.capitalizes = capitalizes;
    }

    public String slug() { return slug; }
    public int termMonths() { return termMonths; }
    public int periodMonths() { return periodMonths; }
    public boolean capitalizes() { return capitalizes; }

    public BigDecimal earlyRedemptionFeePerBond(LocalDate purchaseDate) {
        LocalDate newFeesFrom = LocalDate.of(2024, 9, 1);
        return switch (this) {
            case OTS -> BigDecimal.ZERO;
            case ROR -> new BigDecimal("0.50");
            case DOR -> new BigDecimal("0.70");
            case TOS -> purchaseDate.isBefore(newFeesFrom) ? new BigDecimal("0.70") : new BigDecimal("1.00");
            case COI -> purchaseDate.isBefore(newFeesFrom) ? new BigDecimal("0.70") : new BigDecimal("2.00");
            case EDO -> purchaseDate.isBefore(newFeesFrom) ? new BigDecimal("2.00") : new BigDecimal("3.00");
            case ROS -> purchaseDate.isBefore(newFeesFrom) ? new BigDecimal("0.70") : new BigDecimal("2.00");
            case ROD -> purchaseDate.isBefore(newFeesFrom) ? new BigDecimal("2.00") : new BigDecimal("3.00");
        };
    }

    public boolean earlyRedemptionFeeMayReducePrincipal(int currentPeriod) {
        // ROR/DOR oraz COI w kolejnych okresach pobierają pełną opłatę również wtedy,
        // gdy odsetki bieżącego okresu są od niej niższe. Dla produktów kapitalizowanych
        // opłatę ograniczamy do całego narosłego zysku.
        return currentPeriod > 1 && (this == ROR || this == DOR || this == COI);
    }

    public static RetailBondProduct fromEmission(String emissionCode) {
        if (emissionCode == null || emissionCode.isBlank()) {
            throw new IllegalArgumentException("Podaj kod emisji, np. COI0829.");
        }
        String normalized = emissionCode.trim().toUpperCase(Locale.ROOT);
        for (RetailBondProduct product : values()) {
            if (normalized.startsWith(product.name())) return product;
        }
        throw new IllegalArgumentException(
                "Nieobsługiwany typ obligacji. Freedom obsługuje OTS, ROR, DOR, TOS, COI, EDO, ROS i ROD."
        );
    }
}
