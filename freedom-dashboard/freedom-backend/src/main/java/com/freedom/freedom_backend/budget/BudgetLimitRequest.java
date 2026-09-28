package com.freedom.freedom_backend.budget;

import com.freedom.freedom_backend.transaction.ExpenseCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record BudgetLimitRequest(
        ExpenseCategory category,
        Long categoryId,

        @NotNull
        @DecimalMin("0.0")
        BigDecimal limit
) {}
