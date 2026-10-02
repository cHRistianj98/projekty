package com.freedom.freedom_backend.goal;

import com.freedom.freedom_backend.user.User;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "goals")
public class Goal {

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

    @Column(nullable = false)
    private String name;

    @Column(
            name = "current_amount",
            nullable = false,
            precision = 19,
            scale = 2
    )
    private BigDecimal currentAmount;

    @Column(
            name = "target_amount",
            nullable = false,
            precision = 19,
            scale = 2
    )
    private BigDecimal targetAmount;

    @Column(
            name = "monthly_contribution",
            nullable = false,
            precision = 19,
            scale = 2
    )
    private BigDecimal monthlyContribution;

    @Column(name = "target_date")
    private LocalDate targetDate;

    @Enumerated(EnumType.STRING)
    private GoalPriority priority;

    @Enumerated(EnumType.STRING)
    private GoalType type;

    @Column(nullable = false)
    private String color;

    @Column(
            name = "image_url",
            columnDefinition = "TEXT"
    )
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "image_position")
    private GoalImagePosition imagePosition;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GoalStatus status;

    @Column(name = "completed_at")
    private Instant completedAt;

    protected Goal() {
    }

    public Goal(
            User user,
            String name,
            BigDecimal currentAmount,
            BigDecimal targetAmount,
            BigDecimal monthlyContribution,
            LocalDate targetDate,
            GoalPriority priority,
            GoalType type,
            String color,
            String imageUrl,
            GoalImagePosition imagePosition
    ) {
        this.user = user;
        this.name = name;
        this.currentAmount = currentAmount;
        this.targetAmount = targetAmount;
        this.monthlyContribution = monthlyContribution;
        this.targetDate = targetDate;
        this.priority = priority;
        this.type = type;
        this.color = color;
        this.imageUrl = imageUrl;
        this.imagePosition = imagePosition;
        this.status = currentAmount.compareTo(targetAmount) >= 0
                ? GoalStatus.FUNDED
                : GoalStatus.ACTIVE;
        this.completedAt = null;
    }

    public void update(
            String name,
            BigDecimal currentAmount,
            BigDecimal targetAmount,
            BigDecimal monthlyContribution,
            LocalDate targetDate,
            GoalPriority priority,
            GoalType type,
            String color,
            String imageUrl,
            GoalImagePosition imagePosition
    ) {
        this.name = name;
        this.currentAmount = currentAmount;
        this.targetAmount = targetAmount;
        this.monthlyContribution = monthlyContribution;
        this.targetDate = targetDate;
        this.priority = priority;
        this.type = type;
        this.color = color;
        this.imageUrl = imageUrl;
        this.imagePosition = imagePosition;
        if (this.status != GoalStatus.COMPLETED) {
            this.status = currentAmount.compareTo(targetAmount) >= 0
                    ? GoalStatus.FUNDED
                    : GoalStatus.ACTIVE;
            this.completedAt = null;
        }
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

    public BigDecimal getCurrentAmount() {
        return currentAmount;
    }

    public BigDecimal getTargetAmount() {
        return targetAmount;
    }

    public BigDecimal getMonthlyContribution() {
        return monthlyContribution;
    }

    public LocalDate getTargetDate() {
        return targetDate;
    }

    public GoalPriority getPriority() {
        return priority;
    }

    public GoalType getType() {
        return type;
    }

    public String getColor() {
        return color;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public GoalImagePosition getImagePosition() {
        return imagePosition;
    }

    public GoalStatus getStatus() {
        return status;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }
}
