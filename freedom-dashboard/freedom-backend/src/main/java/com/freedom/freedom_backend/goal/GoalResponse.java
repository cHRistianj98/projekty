package com.freedom.freedom_backend.goal;

import java.math.BigDecimal;
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
        GoalImagePosition imagePosition
) {

    public static GoalResponse from(Goal goal) {
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
                goal.getImagePosition()
        );
    }
}