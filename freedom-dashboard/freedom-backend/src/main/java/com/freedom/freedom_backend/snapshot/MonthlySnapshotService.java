package com.freedom.freedom_backend.snapshot;

import com.freedom.freedom_backend.achievement.AchievementService;
import com.freedom.freedom_backend.asset.Asset;
import com.freedom.freedom_backend.asset.AssetRepository;
import com.freedom.freedom_backend.goal.Goal;
import com.freedom.freedom_backend.goal.GoalRepository;
import com.freedom.freedom_backend.liability.Liability;
import com.freedom.freedom_backend.liability.LiabilityRepository;
import com.freedom.freedom_backend.transaction.Transaction;
import com.freedom.freedom_backend.transaction.TransactionRepository;
import com.freedom.freedom_backend.transaction.TransactionType;
import com.freedom.freedom_backend.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
@Transactional
public class MonthlySnapshotService {

    private final MonthlySnapshotRepository snapshotRepository;
    private final TransactionRepository transactionRepository;
    private final AssetRepository assetRepository;
    private final GoalRepository goalRepository;
    private final LiabilityRepository liabilityRepository;
    private final AchievementService achievementService;

    public MonthlySnapshotService(
            MonthlySnapshotRepository snapshotRepository,
            TransactionRepository transactionRepository,
            AssetRepository assetRepository,
            GoalRepository goalRepository,
            LiabilityRepository liabilityRepository,
            AchievementService achievementService
    ) {
        this.snapshotRepository = snapshotRepository;
        this.transactionRepository = transactionRepository;
        this.assetRepository = assetRepository;
        this.goalRepository = goalRepository;
        this.liabilityRepository = liabilityRepository;
        this.achievementService = achievementService;
    }

    @Transactional(readOnly = true)
    public List<MonthlySnapshotResponse> getAll(
            User user
    ) {
        return snapshotRepository
                .findAllByUserIdOrderByMonthDesc(user.getId())
                .stream()
                .map(MonthlySnapshotResponse::from)
                .toList();
    }

    public MonthlySnapshotResponse closeMonth(
            String month,
            User user
    ) {
        YearMonth yearMonth = parseMonth(month);

        if (
                snapshotRepository
                        .findByUserIdAndMonth(
                                user.getId(),
                                month
                        )
                        .isPresent()
        ) {
            throw new IllegalStateException(
                    "Month " + month + " is already closed"
            );
        }

        LocalDate start = yearMonth.atDay(1);
        LocalDate end = yearMonth.atEndOfMonth();

        List<Transaction> transactions =
                transactionRepository
                        .findAllByUserIdAndDateBetweenOrderByDateAsc(
                                user.getId(),
                                start,
                                end
                        );

        BigDecimal income = transactions.stream()
                .filter(transaction ->
                        transaction.getType()
                                == TransactionType.INCOME
                )
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal expenses = transactions.stream()
                .filter(transaction ->
                        transaction.getType()
                                == TransactionType.EXPENSE
                )
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal surplus =
                income.subtract(expenses);

        BigDecimal savingsRate =
                income.compareTo(BigDecimal.ZERO) > 0
                        ? surplus
                        .divide(
                                income,
                                6,
                                RoundingMode.HALF_UP
                        )
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(
                                4,
                                RoundingMode.HALF_UP
                        )
                        : BigDecimal.ZERO;

        int incomeTransactions = (int) transactions.stream()
                .filter(transaction ->
                        transaction.getType()
                                == TransactionType.INCOME
                )
                .count();

        int expenseTransactions = (int) transactions.stream()
                .filter(transaction ->
                        transaction.getType()
                                == TransactionType.EXPENSE
                )
                .count();

        List<Asset> assets =
                assetRepository.findAllByUserId(
                        user.getId()
                );

        List<Goal> goals =
                goalRepository.findAllByUserId(
                        user.getId()
                );

        List<Liability> liabilities =
                liabilityRepository.findAllByUserId(
                        user.getId()
                );

        BigDecimal totalAssets = assets.stream()
                .map(Asset::getValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalLiabilities =
                liabilities.stream()
                        .map(Liability::getRemainingAmount)
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        );

        BigDecimal netWorth =
                totalAssets.subtract(totalLiabilities);

        int positiveMonths =
                calculatePositiveMonths(
                        user.getId(),
                        end.plusDays(1)
                );

        AchievementService.PlayerResult player =
                achievementService.calculate(
                        netWorth,
                        savingsRate,
                        surplus,
                        positiveMonths,
                        assets,
                        goals,
                        liabilities
                );

        List<MonthlySnapshotAsset> snapshotAssets =
                assets.stream()
                        .map(asset ->
                                new MonthlySnapshotAsset(
                                        asset.getId(),
                                        asset.getName(),
                                        asset.getValue(),
                                        asset.getCategory()
                                )
                        )
                        .toList();

        List<MonthlySnapshotGoal> snapshotGoals =
                goals.stream()
                        .map(goal ->
                                new MonthlySnapshotGoal(
                                        goal.getId(),
                                        goal.getName(),
                                        goal.getCurrentAmount(),
                                        goal.getTargetAmount(),
                                        goal.getMonthlyContribution(),
                                        goal.getTargetDate(),
                                        goal.getPriority(),
                                        goal.getType()
                                )
                        )
                        .toList();

        List<MonthlySnapshotLiability> snapshotLiabilities =
                liabilities.stream()
                        .map(liability ->
                                new MonthlySnapshotLiability(
                                        liability.getId(),
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
                        .toList();

        MonthlySnapshot snapshot =
                new MonthlySnapshot(
                        user,
                        month,
                        Instant.now(),

                        income,
                        expenses,
                        surplus,
                        savingsRate,

                        incomeTransactions,
                        expenseTransactions,

                        netWorth,
                        totalAssets,
                        totalLiabilities,

                        player.totalXp(),
                        player.level(),
                        player.levelName(),
                        player.unlockedAchievements(),
                        player.totalAchievements(),

                        snapshotAssets,
                        snapshotGoals,
                        snapshotLiabilities
                );

        return MonthlySnapshotResponse.from(
                snapshotRepository.save(snapshot)
        );
    }

    private int calculatePositiveMonths(
            Long userId,
            LocalDate before
    ) {
        List<Transaction> transactions =
                transactionRepository
                        .findAllByUserIdAndDateBefore(
                                userId,
                                before
                        );

        return (int) transactions.stream()
                .map(transaction ->
                        YearMonth.from(
                                transaction.getDate()
                        )
                )
                .distinct()
                .filter(month ->
                        hasPositiveCashflow(
                                transactions,
                                month
                        )
                )
                .count();
    }

    private boolean hasPositiveCashflow(
            List<Transaction> transactions,
            YearMonth month
    ) {
        BigDecimal income = BigDecimal.ZERO;
        BigDecimal expenses = BigDecimal.ZERO;

        for (Transaction transaction : transactions) {

            if (
                    !YearMonth
                            .from(transaction.getDate())
                            .equals(month)
            ) {
                continue;
            }

            if (
                    transaction.getType()
                            == TransactionType.INCOME
            ) {
                income =
                        income.add(
                                transaction.getAmount()
                        );
            } else {
                expenses =
                        expenses.add(
                                transaction.getAmount()
                        );
            }
        }

        return income.compareTo(expenses) > 0;
    }

    private YearMonth parseMonth(String month) {
        try {
            return YearMonth.parse(month);
        } catch (Exception exception) {
            throw new IllegalArgumentException(
                    "Month must have YYYY-MM format"
            );
        }
    }
}