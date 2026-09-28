package com.freedom.freedom_backend.recurring;

import com.freedom.freedom_backend.transaction.ExpenseCategory;
import com.freedom.freedom_backend.transaction.TransactionType;
import com.freedom.freedom_backend.user.User;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "recurring_transactions")
public class RecurringTransaction {

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

    @Column(name = "day_of_month", nullable = false)
    private int dayOfMonth;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private boolean active;

    protected RecurringTransaction() {}

    public RecurringTransaction(
            User user,
            TransactionType type,
            String name,
            BigDecimal amount,
            ExpenseCategory category,
            int dayOfMonth,
            LocalDate startDate,
            boolean active
    ) {
        this.user = user;
        update(
                type,
                name,
                amount,
                category,
                dayOfMonth,
                startDate,
                active
        );
    }

    public void update(
            TransactionType type,
            String name,
            BigDecimal amount,
            ExpenseCategory category,
            int dayOfMonth,
            LocalDate startDate,
            boolean active
    ) {
        this.type = type;
        this.name = name;
        this.amount = amount;
        this.category = category;
        this.dayOfMonth = dayOfMonth;
        this.startDate = startDate;
        this.active = active;
    }

    public Long getId() { return id; }
    public TransactionType getType() { return type; }
    public String getName() { return name; }
    public BigDecimal getAmount() { return amount; }
    public ExpenseCategory getCategory() { return category; }
    public int getDayOfMonth() { return dayOfMonth; }
    public LocalDate getStartDate() { return startDate; }
    public boolean isActive() { return active; }
}