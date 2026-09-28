package com.freedom.freedom_backend.transaction;

import com.freedom.freedom_backend.user.User;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    private ExpenseCategory category;

    @Column(nullable = false)
    private boolean recurring;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate date;

    @Column(name = "recurring_rule_id")
    private Long recurringRuleId;

    protected Transaction() {}

    public Transaction(
            User user,
            TransactionType type,
            String name,
            BigDecimal amount,
            ExpenseCategory category,
            boolean recurring,
            LocalDate date,
            Long recurringRuleId
    ) {
        this.user = user;
        update(
                type,
                name,
                amount,
                category,
                recurring,
                date,
                recurringRuleId
        );
    }

    public void update(
            TransactionType type,
            String name,
            BigDecimal amount,
            ExpenseCategory category,
            boolean recurring,
            LocalDate date,
            Long recurringRuleId
    ) {
        this.type = type;
        this.name = name;
        this.amount = amount;
        this.category = category;
        this.recurring = recurring;
        this.date = date;
        this.recurringRuleId = recurringRuleId;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public TransactionType getType() { return type; }
    public String getName() { return name; }
    public BigDecimal getAmount() { return amount; }
    public ExpenseCategory getCategory() { return category; }
    public boolean isRecurring() { return recurring; }
    public LocalDate getDate() { return date; }
    public Long getRecurringRuleId() { return recurringRuleId; }
}