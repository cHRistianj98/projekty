package com.freedom.freedom_backend.budget;

import com.freedom.freedom_backend.transaction.ExpenseCategory;

import java.math.BigDecimal;
import java.util.List;

public record BudgetPlanResponse(
        String month,
        List<LimitResponse> limits
) {

    public record LimitResponse(
            ExpenseCategory category,
            BigDecimal limit
    ) {}

    public static BudgetPlanResponse from(
            BudgetPlan plan
    ) {
        return new BudgetPlanResponse(
                plan.getMonth(),
                plan.getLimits()
                        .stream()
                        .map(limit ->
                                new LimitResponse(
                                        limit.getCategory(),
                                        limit.getLimit()
                                )
                        )
                        .toList()
        );
    }
}