package com.freedom.freedom_backend.transaction;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionRequest(
        @NotNull TransactionType type,
        @NotBlank String name,
        @NotNull @Positive BigDecimal amount,
        ExpenseCategory category,
        Long categoryId,
        boolean recurring,
        @NotNull LocalDate date,
        Long recurringRuleId,
        Long assetId,
        Long goalId
) {
}
