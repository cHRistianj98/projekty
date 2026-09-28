package com.freedom.freedom_backend.budget;

import com.freedom.freedom_backend.category.Category;
import com.freedom.freedom_backend.transaction.ExpenseCategory;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Embeddable
public class BudgetLimit {

    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    private ExpenseCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category detailedCategory;

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
            Category detailedCategory,
            BigDecimal limit
    ) {
        this.category = category;
        this.detailedCategory = detailedCategory;
        this.limit = limit;
    }

    public ExpenseCategory getCategory() {
        return category;
    }

    public Category getDetailedCategory() {
        return detailedCategory;
    }

    public BigDecimal getLimit() {
        return limit;
    }
}
