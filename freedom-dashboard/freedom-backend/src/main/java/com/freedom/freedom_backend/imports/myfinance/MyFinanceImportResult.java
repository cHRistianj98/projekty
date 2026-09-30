package com.freedom.freedom_backend.imports.myfinance;

import java.math.BigDecimal;

public record MyFinanceImportResult(
        int importedTransactions,
        int importedIncomes,
        int importedExpenses,
        int duplicatesSkipped,
        int categoriesCreated,
        BigDecimal incomeAmount,
        BigDecimal expenseAmount,
        BigDecimal systemCashChange
) { }
