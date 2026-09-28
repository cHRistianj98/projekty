package com.freedom.freedom_backend.snapshot;

import com.freedom.freedom_backend.goal.GoalPriority;
import com.freedom.freedom_backend.goal.GoalType;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "monthly_snapshot_goals")
public class MonthlySnapshotGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_goal_id", nullable = false)
    private Long sourceGoalId;

    @Column(nullable = false)
    private String name;

    @Column(name = "current_amount", nullable = false)
    private BigDecimal currentAmount;

    @Column(name = "target_amount", nullable = false)
    private BigDecimal targetAmount;

    @Column(name = "monthly_contribution", nullable = false)
    private BigDecimal monthlyContribution;

    @Column(name = "target_date")
    private LocalDate targetDate;

    @Enumerated(EnumType.STRING)
    private GoalPriority priority;

    @Enumerated(EnumType.STRING)
    private GoalType type;

    protected MonthlySnapshotGoal() {}

    public MonthlySnapshotGoal(
            Long sourceGoalId,
            String name,
            BigDecimal currentAmount,
            BigDecimal targetAmount,
            BigDecimal monthlyContribution,
            LocalDate targetDate,
            GoalPriority priority,
            GoalType type
    ) {
        this.sourceGoalId = sourceGoalId;
        this.name = name;
        this.currentAmount = currentAmount;
        this.targetAmount = targetAmount;
        this.monthlyContribution = monthlyContribution;
        this.targetDate = targetDate;
        this.priority = priority;
        this.type = type;
    }

    public Long getSourceGoalId() { return sourceGoalId; }
    public String getName() { return name; }
    public BigDecimal getCurrentAmount() { return currentAmount; }
    public BigDecimal getTargetAmount() { return targetAmount; }
    public BigDecimal getMonthlyContribution() { return monthlyContribution; }
    public LocalDate getTargetDate() { return targetDate; }
    public GoalPriority getPriority() { return priority; }
    public GoalType getType() { return type; }
}