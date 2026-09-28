package com.freedom.freedom_backend.liability;

import java.math.BigDecimal;

public record LiabilityResponse(

        Long id,
        String name,
        LiabilityType type,
        BigDecimal originalAmount,
        BigDecimal remainingAmount,
        BigDecimal monthlyPayment,
        BigDecimal principalPayment,
        BigDecimal interestPayment,
        BigDecimal interestRate

) {

    public static LiabilityResponse from(
            Liability liability
    ) {
        return new LiabilityResponse(
                liability.getId(),
                liability.getName(),
                liability.getType(),
                liability.getOriginalAmount(),
                liability.getRemainingAmount(),
                liability.getMonthlyPayment(),
                liability.getPrincipalPayment(),
                liability.getInterestPayment(),
                liability.getInterestRate()
        );
    }
}