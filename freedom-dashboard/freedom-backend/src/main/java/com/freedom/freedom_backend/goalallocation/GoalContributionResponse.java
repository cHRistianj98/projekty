package com.freedom.freedom_backend.goalallocation;

import java.math.BigDecimal;
import java.time.Instant;

public record GoalContributionResponse(
        Long id,
        Long goalId,
        BigDecimal amount,
        GoalAllocationMode mode,
        Long sourceAssetId,
        Long targetAssetId,
        Instant createdAt
) {
}
