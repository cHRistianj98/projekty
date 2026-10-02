package com.freedom.freedom_backend.goal;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record GoalResponse(
        Long id,
        String name,
        BigDecimal currentAmount,
        BigDecimal targetAmount,
        BigDecimal monthlyContribution,
        LocalDate targetDate,
        GoalPriority priority,
        GoalType type,
        String color,
        String imageUrl,
        GoalImagePosition imagePosition,
        GoalStatus status,
        Instant completedAt,
        BigDecimal reservedAmount,
        BigDecimal spentAmount
) {
    public static GoalResponse from(
            Goal goal,
            BigDecimal reservedAmount,
            BigDecimal spentAmount
    ) {
        return new GoalResponse(
                goal.getId(),
                goal.getName(),
                goal.getCurrentAmount(),
                goal.getTargetAmount(),
                goal.getMonthlyContribution(),
                goal.getTargetDate(),
                goal.getPriority(),
                goal.getType(),
                goal.getColor(),
                goal.getImageUrl(),
                goal.getImagePosition(),
                goal.getStatus(),
                goal.getCompletedAt(),
                reservedAmount,
                spentAmount
        );
    }
}
