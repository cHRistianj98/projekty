package com.freedom.freedom_backend.imports.myfinance;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

record MyFinanceSourceTransaction(
        String uid,
        Instant createdAt,
        Instant modifiedAt,
        SourceType type,
        BigDecimal amount,
        LocalDate date,
        String comment,
        String categoryUid,
        String categoryName
) {
    enum SourceType { INCOME, EXPENSE }
}
