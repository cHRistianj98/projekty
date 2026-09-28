package com.freedom.freedom_backend.snapshot;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record MonthlySnapshotResponse(

        Long id,
        String month,
        Instant closedAt,

        Cashflow cashflow,
        Wealth wealth,

        List<MonthlySnapshotRequest.AssetSnapshot> assets,
        List<MonthlySnapshotRequest.GoalSnapshot> goals,
        List<MonthlySnapshotRequest.LiabilitySnapshot> liabilities,

        MonthlySnapshotRequest.Player player

) {

    public record Cashflow(
            BigDecimal income,
            BigDecimal expenses,
            BigDecimal surplus,
            BigDecimal savingsRate,
            int incomeTransactions,
            int expenseTransactions
    ) {}

    public record Wealth(
            BigDecimal netWorth,
            BigDecimal assets,
            BigDecimal liabilities
    ) {}

    public static MonthlySnapshotResponse from(
            MonthlySnapshot snapshot
    ) {
        return new MonthlySnapshotResponse(

                snapshot.getId(),
                snapshot.getMonth(),
                snapshot.getClosedAt(),

                new Cashflow(
                        snapshot.getIncome(),
                        snapshot.getExpenses(),
                        snapshot.getSurplus(),
                        snapshot.getSavingsRate(),
                        snapshot.getIncomeTransactions(),
                        snapshot.getExpenseTransactions()
                ),

                new Wealth(
                        snapshot.getNetWorth(),
                        snapshot.getAssets(),
                        snapshot.getLiabilities()
                ),

                snapshot.getSnapshotAssets()
                        .stream()
                        .map(asset ->
                                new MonthlySnapshotRequest.AssetSnapshot(
                                        asset.getSourceAssetId(),
                                        asset.getName(),
                                        asset.getValue(),
                                        asset.getCategory()
                                )
                        )
                        .toList(),

                snapshot.getSnapshotGoals()
                        .stream()
                        .map(goal ->
                                new MonthlySnapshotRequest.GoalSnapshot(
                                        goal.getSourceGoalId(),
                                        goal.getName(),
                                        goal.getCurrentAmount(),
                                        goal.getTargetAmount(),
                                        goal.getMonthlyContribution(),
                                        goal.getTargetDate(),
                                        goal.getPriority(),
                                        goal.getType()
                                )
                        )
                        .toList(),

                snapshot.getSnapshotLiabilities()
                        .stream()
                        .map(liability ->
                                new MonthlySnapshotRequest.LiabilitySnapshot(
                                        liability.getSourceLiabilityId(),
                                        liability.getName(),
                                        liability.getType(),
                                        liability.getOriginalAmount(),
                                        liability.getRemainingAmount(),
                                        liability.getMonthlyPayment(),
                                        liability.getPrincipalPayment(),
                                        liability.getInterestPayment(),
                                        liability.getInterestRate()
                                )
                        )
                        .toList(),

                new MonthlySnapshotRequest.Player(
                        snapshot.getPlayerTotalXp(),
                        snapshot.getPlayerLevel(),
                        snapshot.getPlayerLevelName(),
                        snapshot.getUnlockedAchievements(),
                        snapshot.getTotalAchievements()
                )
        );
    }
}