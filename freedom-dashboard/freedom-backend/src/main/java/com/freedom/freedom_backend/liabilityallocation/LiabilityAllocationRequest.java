package com.freedom.freedom_backend.liabilityallocation;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record LiabilityAllocationRequest(
        @NotNull Long assetId,
        @NotNull @DecimalMin("0.01") BigDecimal amount
) {}
