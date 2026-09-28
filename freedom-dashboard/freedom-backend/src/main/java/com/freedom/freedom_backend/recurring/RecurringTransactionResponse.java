package com.freedom.freedom_backend.recurring;

import com.freedom.freedom_backend.transaction.ExpenseCategory;
import com.freedom.freedom_backend.transaction.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RecurringTransactionResponse(
        Long id,
        TransactionType type,
        String name,
        BigDecimal amount,
        ExpenseCategory category,
        int dayOfMonth,
        LocalDate startDate,
        boolean active
) {

    public static RecurringTransactionResponse from(
            RecurringTransaction transaction
    ) {
        return new RecurringTransactionResponse(
                transaction.getId(),
                transaction.getType(),
                transaction.getName(),
                transaction.getAmount(),
                transaction.getCategory(),
                transaction.getDayOfMonth(),
                transaction.getStartDate(),
                transaction.isActive()
        );
    }
}