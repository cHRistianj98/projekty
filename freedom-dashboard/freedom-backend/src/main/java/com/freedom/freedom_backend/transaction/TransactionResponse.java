package com.freedom.freedom_backend.transaction;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionResponse(
        Long id,
        TransactionType type,
        String name,
        BigDecimal amount,
        ExpenseCategory category,
        boolean recurring,
        LocalDate date,
        Long recurringRuleId
) {

    public static TransactionResponse from(
            Transaction transaction
    ) {
        return new TransactionResponse(
                transaction.getId(),
                transaction.getType(),
                transaction.getName(),
                transaction.getAmount(),
                transaction.getCategory(),
                transaction.isRecurring(),
                transaction.getDate(),
                transaction.getRecurringRuleId()
        );
    }
}