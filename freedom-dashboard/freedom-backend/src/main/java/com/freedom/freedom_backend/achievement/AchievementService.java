package com.freedom.freedom_backend.achievement;

import com.freedom.freedom_backend.asset.Asset;
import com.freedom.freedom_backend.asset.AssetCategory;
import com.freedom.freedom_backend.goal.Goal;
import com.freedom.freedom_backend.liability.Liability;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class AchievementService {

    private static final int TOTAL_ACHIEVEMENTS = 15;

    public PlayerResult calculate(
            BigDecimal netWorth,
            BigDecimal savingsRate,
            BigDecimal surplus,
            int positiveMonths,
            List<Asset> assets,
            List<Goal> goals,
            List<Liability> liabilities
    ) {
        BigDecimal investedAssets = assets.stream()
                .filter(this::isInvestment)
                .map(Asset::getValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long completedGoals = goals.stream()
                .filter(goal ->
                        goal.getTargetAmount().compareTo(BigDecimal.ZERO) > 0
                        && goal.getCurrentAmount()
                                .compareTo(goal.getTargetAmount()) >= 0
                )
                .count();

        long paidLiabilities = liabilities.stream()
                .filter(liability ->
                        liability.getRemainingAmount()
                                .compareTo(BigDecimal.ZERO) <= 0
                )
                .count();

        int xp = 0;
        int unlocked = 0;

        // WEALTH

        if (gte(netWorth, 10_000)) {
            xp += 50;
            unlocked++;
        }

        if (gte(netWorth, 30_000)) {
            xp += 75;
            unlocked++;
        }

        if (gte(netWorth, 100_000)) {
            xp += 250;
            unlocked++;
        }

        if (gte(netWorth, 250_000)) {
            xp += 400;
            unlocked++;
        }

        if (gte(netWorth, 500_000)) {
            xp += 650;
            unlocked++;
        }

        if (gte(netWorth, 1_000_000)) {
            xp += 1_000;
            unlocked++;
        }

        if (gte(netWorth, 3_000_000)) {
            xp += 3_000;
            unlocked++;
        }

        // CASHFLOW

        if (gte(savingsRate, 50)) {
            xp += 150;
            unlocked++;
        }

        if (gte(surplus, 10_000)) {
            xp += 200;
            unlocked++;
        }

        if (gte(surplus, 20_000)) {
            xp += 350;
            unlocked++;
        }

        if (positiveMonths >= 3) {
            xp += 200;
            unlocked++;
        }

        // INVESTING

        if (gte(investedAssets, 100_000)) {
            xp += 250;
            unlocked++;
        }

        if (gte(investedAssets, 250_000)) {
            xp += 500;
            unlocked++;
        }

        // GOALS

        if (completedGoals >= 1) {
            xp += 200;
            unlocked++;
        }

        // DEBT

        if (paidLiabilities >= 1) {
            xp += 300;
            unlocked++;
        }

        LevelResult level = calculateLevel(xp);

        return new PlayerResult(
                xp,
                level.level(),
                level.name(),
                unlocked,
                TOTAL_ACHIEVEMENTS
        );
    }

    private boolean isInvestment(Asset asset) {
        return asset.getCategory() == AssetCategory.STOCKS
                || asset.getCategory() == AssetCategory.CRYPTO
                || asset.getCategory() == AssetCategory.BUSINESS
                || asset.getCategory() == AssetCategory.METALS;
    }

    private boolean gte(
            BigDecimal value,
            long threshold
    ) {
        return value.compareTo(
                BigDecimal.valueOf(threshold)
        ) >= 0;
    }

    private LevelResult calculateLevel(int totalXp) {
        LevelResult current =
                new LevelResult(1, "Rookie", 0);

        LevelResult[] levels = {
                new LevelResult(1, "Rookie", 0),
                new LevelResult(2, "Planner", 250),
                new LevelResult(3, "Saver", 600),
                new LevelResult(4, "Builder", 1_000),
                new LevelResult(5, "Investor", 1_600),
                new LevelResult(6, "Strategist", 2_500),
                new LevelResult(7, "Capitalist", 4_000),
                new LevelResult(8, "Mogul", 6_500),
                new LevelResult(9, "Tycoon", 10_000),
                new LevelResult(10, "FREE", 15_000)
        };

        for (LevelResult level : levels) {
            if (totalXp >= level.requiredXp()) {
                current = level;
            }
        }

        return current;
    }

    public record PlayerResult(
            int totalXp,
            int level,
            String levelName,
            int unlockedAchievements,
            int totalAchievements
    ) {}

    private record LevelResult(
            int level,
            String name,
            int requiredXp
    ) {}
}