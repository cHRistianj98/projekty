package com.freedom.freedom_backend.recurring;

import com.freedom.freedom_backend.transaction.ExpenseCategory;
import com.freedom.freedom_backend.transaction.TransactionType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RecurringTransactionRequest(

        @NotNull
        TransactionType type,

        @NotBlank
        String name,

        @NotNull
        @DecimalMin("0.0")
        BigDecimal amount,

        ExpenseCategory category,

        @Min(1)
        @Max(31)
        int dayOfMonth,

        @NotNull
        LocalDate startDate,

        boolean active

) {}