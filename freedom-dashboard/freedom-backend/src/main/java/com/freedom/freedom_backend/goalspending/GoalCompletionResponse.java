package com.freedom.freedom_backend.goalspending;

import com.freedom.freedom_backend.goal.GoalStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record GoalCompletionResponse(
        Long goalId,
        GoalStatus status,
        BigDecimal spentAmount,
        BigDecimal releasedAmount,
        BigDecimal transferredAmount,
        Long targetGoalId,
        Instant completedAt
) {
}
