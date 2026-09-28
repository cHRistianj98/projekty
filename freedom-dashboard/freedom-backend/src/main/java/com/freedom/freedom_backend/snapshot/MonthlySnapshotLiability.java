package com.freedom.freedom_backend.snapshot;

import com.freedom.freedom_backend.liability.LiabilityType;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "monthly_snapshot_liabilities")
public class MonthlySnapshotLiability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_liability_id", nullable = false)
    private Long sourceLiabilityId;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    private LiabilityType type;

    @Column(name = "original_amount", nullable = false)
    private BigDecimal originalAmount;

    @Column(name = "remaining_amount", nullable = false)
    private BigDecimal remainingAmount;

    @Column(name = "monthly_payment", nullable = false)
    private BigDecimal monthlyPayment;

    @Column(name = "principal_payment", nullable = false)
    private BigDecimal principalPayment;

    @Column(name = "interest_payment", nullable = false)
    private BigDecimal interestPayment;

    @Column(name = "interest_rate", nullable = false)
    private BigDecimal interestRate;

    protected MonthlySnapshotLiability() {}

    public MonthlySnapshotLiability(
            Long sourceLiabilityId,
            String name,
            LiabilityType type,
            BigDecimal originalAmount,
            BigDecimal remainingAmount,
            BigDecimal monthlyPayment,
            BigDecimal principalPayment,
            BigDecimal interestPayment,
            BigDecimal interestRate
    ) {
        this.sourceLiabilityId = sourceLiabilityId;
        this.name = name;
        this.type = type;
        this.originalAmount = originalAmount;
        this.remainingAmount = remainingAmount;
        this.monthlyPayment = monthlyPayment;
        this.principalPayment = principalPayment;
        this.interestPayment = interestPayment;
        this.interestRate = interestRate;
    }

    public Long getSourceLiabilityId() { return sourceLiabilityId; }
    public String getName() { return name; }
    public LiabilityType getType() { return type; }
    public BigDecimal getOriginalAmount() { return originalAmount; }
    public BigDecimal getRemainingAmount() { return remainingAmount; }
    public BigDecimal getMonthlyPayment() { return monthlyPayment; }
    public BigDecimal getPrincipalPayment() { return principalPayment; }
    public BigDecimal getInterestPayment() { return interestPayment; }
    public BigDecimal getInterestRate() { return interestRate; }
}