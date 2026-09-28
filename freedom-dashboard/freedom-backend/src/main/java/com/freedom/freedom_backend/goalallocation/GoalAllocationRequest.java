package com.freedom.freedom_backend.goalallocation;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record GoalAllocationRequest(
        @NotNull
        @DecimalMin(value = "0.01")
        BigDecimal amount,

        @NotNull
        GoalAllocationMode mode,

        Long sourceAssetId,

        @NotNull
        Long targetAssetId
) {
}
