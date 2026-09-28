package com.freedom.freedom_backend.snapshot;

import com.freedom.freedom_backend.asset.AssetCategory;
import com.freedom.freedom_backend.goal.GoalPriority;
import com.freedom.freedom_backend.goal.GoalType;
import com.freedom.freedom_backend.liability.LiabilityType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record MonthlySnapshotRequest(

        @NotBlank String month,
        @NotNull Instant closedAt,

        @NotNull @Valid Cashflow cashflow,
        @NotNull @Valid Wealth wealth,

        @NotNull List<@Valid AssetSnapshot> assets,
        @NotNull List<@Valid GoalSnapshot> goals,
        @NotNull List<@Valid LiabilitySnapshot> liabilities,

        @NotNull @Valid Player player

) {

    public record Cashflow(
            @NotNull BigDecimal income,
            @NotNull BigDecimal expenses,
            @NotNull BigDecimal surplus,
            @NotNull BigDecimal savingsRate,
            int incomeTransactions,
            int expenseTransactions
    ) {}

    public record Wealth(
            @NotNull BigDecimal netWorth,
            @NotNull BigDecimal assets,
            @NotNull BigDecimal liabilities
    ) {}

    public record AssetSnapshot(
            @NotNull Long id,
            @NotBlank String name,
            @NotNull BigDecimal value,
            AssetCategory category
    ) {}

    public record GoalSnapshot(
            @NotNull Long id,
            @NotBlank String name,
            @NotNull BigDecimal currentAmount,
            @NotNull BigDecimal targetAmount,
            @NotNull BigDecimal monthlyContribution,
            LocalDate targetDate,
            GoalPriority priority,
            GoalType type
    ) {}

    public record LiabilitySnapshot(
            @NotNull Long id,
            @NotBlank String name,
            LiabilityType type,
            @NotNull BigDecimal originalAmount,
            @NotNull BigDecimal remainingAmount,
            @NotNull BigDecimal monthlyPayment,
            @NotNull BigDecimal principalPayment,
            @NotNull BigDecimal interestPayment,
            @NotNull BigDecimal interestRate
    ) {}

    public record Player(
            int totalXp,
            int level,
            @NotBlank String levelName,
            int unlockedAchievements,
            int totalAchievements
    ) {}
}