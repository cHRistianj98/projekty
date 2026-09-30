package com.freedom.freedom_backend.imports.myfinance;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MyFinanceImportPreview(
        String fileName,
        int sourceTransactions,
        int alreadyImported,
        int newTransactions,
        int newIncomes,
        int newExpenses,
        BigDecimal newIncomeAmount,
        BigDecimal newExpenseAmount,
        BigDecimal systemCashChange,
        int newCategories,
        LocalDate earliestDate,
        LocalDate latestDate
) { }
