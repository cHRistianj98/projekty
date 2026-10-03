package com.freedom.freedom_backend.asset;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CashReconciliationItemRequest(
        @NotNull Long assetId,
        @NotNull @DecimalMin(value = "0.00", inclusive = true) BigDecimal targetValue
) {}
