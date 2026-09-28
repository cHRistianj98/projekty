package com.freedom.freedom_backend.liability;

import com.freedom.freedom_backend.user.User;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "liabilities")
public class Liability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "user_id",
            nullable = false
    )
    private User user;

    @Column(
            nullable = false
    )
    private String name;

    @Enumerated(EnumType.STRING)
    @Column
    private LiabilityType type;

    @Column(
            name = "original_amount",
            nullable = false,
            precision = 19,
            scale = 2
    )
    private BigDecimal originalAmount;

    @Column(
            name = "remaining_amount",
            nullable = false,
            precision = 19,
            scale = 2
    )
    private BigDecimal remainingAmount;

    @Column(
            name = "monthly_payment",
            nullable = false,
            precision = 19,
            scale = 2
    )
    private BigDecimal monthlyPayment;

    @Column(
            name = "principal_payment",
            nullable = false,
            precision = 19,
            scale = 2
    )
    private BigDecimal principalPayment;

    @Column(
            name = "interest_payment",
            nullable = false,
            precision = 19,
            scale = 2
    )
    private BigDecimal interestPayment;

    @Column(
            name = "interest_rate",
            nullable = false,
            precision = 10,
            scale = 4
    )
    private BigDecimal interestRate;

    protected Liability() {
    }

    public Liability(
            User user,
            String name,
            LiabilityType type,
            BigDecimal originalAmount,
            BigDecimal remainingAmount,
            BigDecimal monthlyPayment,
            BigDecimal principalPayment,
            BigDecimal interestPayment,
            BigDecimal interestRate
    ) {
        this.user = user;
        this.name = name;
        this.type = type;
        this.originalAmount = originalAmount;
        this.remainingAmount = remainingAmount;
        this.monthlyPayment = monthlyPayment;
        this.principalPayment = principalPayment;
        this.interestPayment = interestPayment;
        this.interestRate = interestRate;
    }

    public void update(
            String name,
            LiabilityType type,
            BigDecimal originalAmount,
            BigDecimal remainingAmount,
            BigDecimal monthlyPayment,
            BigDecimal principalPayment,
            BigDecimal interestPayment,
            BigDecimal interestRate
    ) {
        this.name = name;
        this.type = type;
        this.originalAmount = originalAmount;
        this.remainingAmount = remainingAmount;
        this.monthlyPayment = monthlyPayment;
        this.principalPayment = principalPayment;
        this.interestPayment = interestPayment;
        this.interestRate = interestRate;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getName() {
        return name;
    }

    public LiabilityType getType() {
        return type;
    }

    public BigDecimal getOriginalAmount() {
        return originalAmount;
    }

    public BigDecimal getRemainingAmount() {
        return remainingAmount;
    }

    public BigDecimal getMonthlyPayment() {
        return monthlyPayment;
    }

    public BigDecimal getPrincipalPayment() {
        return principalPayment;
    }

    public BigDecimal getInterestPayment() {
        return interestPayment;
    }

    public BigDecimal getInterestRate() {
        return interestRate;
    }
}