package com.freedom.freedom_backend.liability;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record LiabilityRequest(

        @NotBlank
        String name,

        LiabilityType type,

        @NotNull
        @DecimalMin("0.0")
        BigDecimal originalAmount,

        @NotNull
        @DecimalMin("0.0")
        BigDecimal remainingAmount,

        @NotNull
        @DecimalMin("0.0")
        BigDecimal monthlyPayment,

        @NotNull
        @DecimalMin("0.0")
        BigDecimal principalPayment,

        @NotNull
        @DecimalMin("0.0")
        BigDecimal interestPayment,

        @NotNull
        @DecimalMin("0.0")
        BigDecimal interestRate

) {
}