package com.freedom.freedom_backend.transaction;

import com.freedom.freedom_backend.category.Category;
import com.freedom.freedom_backend.category.CategoryGroup;
import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionResponse(
        Long id,
        TransactionType type,
        String name,
        BigDecimal amount,
        ExpenseCategory category,
        Long categoryId,
        String categoryName,
        String categoryIconKey,
        String categoryColor,
        CategoryGroup categoryGroup,
        boolean recurring,
        LocalDate date,
        Long recurringRuleId
) {
    public static TransactionResponse from(Transaction t) {
        Category c = t.getDetailedCategory();
        return new TransactionResponse(
                t.getId(), t.getType(), t.getName(), t.getAmount(), t.getCategory(),
                c == null ? null : c.getId(), c == null ? null : c.getName(),
                c == null ? null : c.getIconKey(), c == null ? null : c.getColor(),
                c == null ? null : c.getGroup(), t.isRecurring(), t.getDate(), t.getRecurringRuleId()
        );
    }
}
