package com.freedom.freedom_backend.budget;

import com.freedom.freedom_backend.category.Category;
import com.freedom.freedom_backend.transaction.ExpenseCategory;

import java.math.BigDecimal;
import java.util.List;

public record BudgetPlanResponse(
        String month,
        List<LimitResponse> limits
) {

    public record LimitResponse(
            ExpenseCategory category,
            Long categoryId,
            String categoryName,
            String categoryIconKey,
            String categoryColor,
            String categoryGroup,
            BigDecimal limit
    ) {}

    public static BudgetPlanResponse from(
            BudgetPlan plan
    ) {
        return new BudgetPlanResponse(
                plan.getMonth(),
                plan.getLimits()
                        .stream()
                        .map(limit -> {
                            Category detailed =
                                    limit.getDetailedCategory();

                            return new LimitResponse(
                                    limit.getCategory(),
                                    detailed != null ? detailed.getId() : null,
                                    detailed != null ? detailed.getName() : null,
                                    detailed != null ? detailed.getIconKey() : null,
                                    detailed != null ? detailed.getColor() : null,
                                    detailed != null ? detailed.getGroup().name() : null,
                                    limit.getLimit()
                            );
                        })
                        .toList()
        );
    }
}
