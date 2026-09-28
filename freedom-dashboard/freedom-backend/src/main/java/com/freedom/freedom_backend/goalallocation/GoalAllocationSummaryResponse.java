package com.freedom.freedom_backend.goalallocation;

import java.math.BigDecimal;
import java.util.List;

public record GoalAllocationSummaryResponse(
        Long goalId,
        BigDecimal goalCurrentAmount,
        List<GoalAllocationItemResponse> allocations,
        List<GoalContributionResponse> contributions
) {
}
