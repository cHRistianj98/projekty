package com.freedom.freedom_backend.budget;

import com.freedom.freedom_backend.transaction.ExpenseCategory;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Embeddable
public class BudgetLimit {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExpenseCategory category;

    @Column(
            name = "limit_amount",
            nullable = false,
            precision = 19,
            scale = 2
    )
    private BigDecimal limit;

    protected BudgetLimit() {}

    public BudgetLimit(
            ExpenseCategory category,
            BigDecimal limit
    ) {
        this.category = category;
        this.limit = limit;
    }

    public ExpenseCategory getCategory() {
        return category;
    }

    public BigDecimal getLimit() {
        return limit;
    }
}