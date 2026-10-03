package com.freedom.freedom_backend.retailbond;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RetailBondPositionRequest(
        @NotBlank String emissionCode,
        @NotNull @Min(1) Integer quantity,
        @Min(0) Integer blockedQuantity,
        @NotNull LocalDate purchaseDate,
        @DecimalMin("0.0") BigDecimal currentGrossValue
) {}
