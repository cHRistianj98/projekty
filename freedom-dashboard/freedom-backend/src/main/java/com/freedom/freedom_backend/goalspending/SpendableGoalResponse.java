package com.freedom.freedom_backend.goalspending;

import com.freedom.freedom_backend.goal.GoalStatus;

import java.math.BigDecimal;

public record SpendableGoalResponse(
        Long goalId,
        String name,
        GoalStatus status,
        String color,
        String imageUrl,
        BigDecimal targetAmount,
        BigDecimal coveredAmount,
        BigDecimal totalReserved,
        BigDecimal reservedOnAsset,
        BigDecimal spentAmount
) {
}
