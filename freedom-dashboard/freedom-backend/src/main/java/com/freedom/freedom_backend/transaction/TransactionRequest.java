package com.freedom.freedom_backend.transaction;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionRequest(

        @NotNull
        TransactionType type,

        @NotBlank
        String name,

        @NotNull
        @DecimalMin("0.0")
        BigDecimal amount,

        ExpenseCategory category,

        boolean recurring,

        @NotNull
        LocalDate date,

        Long recurringRuleId

) {}