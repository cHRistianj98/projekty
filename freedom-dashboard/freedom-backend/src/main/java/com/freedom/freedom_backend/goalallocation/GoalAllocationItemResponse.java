package com.freedom.freedom_backend.goalallocation;

import java.math.BigDecimal;

public record GoalAllocationItemResponse(
        Long id,
        Long goalId,
        Long assetId,
        String assetName,
        BigDecimal amount
) {
}
