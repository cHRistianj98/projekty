package com.freedom.freedom_backend.transaction;

import com.freedom.freedom_backend.category.Category;
import com.freedom.freedom_backend.user.User;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "transactions")
public class Transaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private TransactionType type;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    // Legacy 1.0 group. Kept for old rows and existing analytics during migration.
    @Enumerated(EnumType.STRING)
    private ExpenseCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category detailedCategory;

    @Column(nullable = false)
    private boolean recurring;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate date;

    @Column(name = "recurring_rule_id")
    private Long recurringRuleId;

    @Column(name = "asset_id")
    private Long assetId;

    @Column(name = "goal_id")
    private Long goalId;

    protected Transaction() {}

    public Transaction(User user, TransactionType type, String name, BigDecimal amount,
                       ExpenseCategory category, Category detailedCategory, boolean recurring,
                       LocalDate date, Long recurringRuleId, Long assetId, Long goalId) {
        this.user = user;
        update(type, name, amount, category, detailedCategory, recurring, date, recurringRuleId, assetId, goalId);
    }

    public void update(TransactionType type, String name, BigDecimal amount,
                       ExpenseCategory category, Category detailedCategory, boolean recurring,
                       LocalDate date, Long recurringRuleId, Long assetId, Long goalId) {
        this.type = type;
        this.name = name;
        this.amount = amount;
        this.category = category;
        this.detailedCategory = detailedCategory;
        this.recurring = recurring;
        this.date = date;
        this.recurringRuleId = recurringRuleId;
        this.assetId = assetId;
        this.goalId = goalId;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public TransactionType getType() { return type; }
    public String getName() { return name; }
    public BigDecimal getAmount() { return amount; }
    public ExpenseCategory getCategory() { return category; }
    public Category getDetailedCategory() { return detailedCategory; }
    public boolean isRecurring() { return recurring; }
    public LocalDate getDate() { return date; }
    public Long getRecurringRuleId() { return recurringRuleId; }
    public Long getAssetId() { return assetId; }
    public Long getGoalId() { return goalId; }
}
