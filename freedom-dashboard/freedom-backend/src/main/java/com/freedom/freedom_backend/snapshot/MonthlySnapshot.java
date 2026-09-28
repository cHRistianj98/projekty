package com.freedom.freedom_backend.snapshot;

import com.freedom.freedom_backend.user.User;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "monthly_snapshots")
public class MonthlySnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 7)
    private String month;

    @Column(name = "closed_at", nullable = false)
    private Instant closedAt;

    @Column(nullable = false)
    private BigDecimal income;

    @Column(nullable = false)
    private BigDecimal expenses;

    @Column(nullable = false)
    private BigDecimal surplus;

    @Column(name = "savings_rate", nullable = false)
    private BigDecimal savingsRate;

    @Column(name = "income_transactions", nullable = false)
    private int incomeTransactions;

    @Column(name = "expense_transactions", nullable = false)
    private int expenseTransactions;

    @Column(name = "net_worth", nullable = false)
    private BigDecimal netWorth;

    @Column(nullable = false)
    private BigDecimal assets;

    @Column(nullable = false)
    private BigDecimal liabilities;

    @Column(name = "player_total_xp", nullable = false)
    private int playerTotalXp;

    @Column(name = "player_level", nullable = false)
    private int playerLevel;

    @Column(name = "player_level_name", nullable = false)
    private String playerLevelName;

    @Column(name = "unlocked_achievements", nullable = false)
    private int unlockedAchievements;

    @Column(name = "total_achievements", nullable = false)
    private int totalAchievements;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "snapshot_id", nullable = false)
    private List<MonthlySnapshotAsset> snapshotAssets =
            new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "snapshot_id", nullable = false)
    private List<MonthlySnapshotGoal> snapshotGoals =
            new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "snapshot_id", nullable = false)
    private List<MonthlySnapshotLiability> snapshotLiabilities =
            new ArrayList<>();

    protected MonthlySnapshot() {}

    public MonthlySnapshot(
            User user,
            String month,
            Instant closedAt,
            BigDecimal income,
            BigDecimal expenses,
            BigDecimal surplus,
            BigDecimal savingsRate,
            int incomeTransactions,
            int expenseTransactions,
            BigDecimal netWorth,
            BigDecimal assets,
            BigDecimal liabilities,
            int playerTotalXp,
            int playerLevel,
            String playerLevelName,
            int unlockedAchievements,
            int totalAchievements,
            List<MonthlySnapshotAsset> snapshotAssets,
            List<MonthlySnapshotGoal> snapshotGoals,
            List<MonthlySnapshotLiability> snapshotLiabilities
    ) {
        this.user = user;
        this.month = month;
        this.closedAt = closedAt;
        this.income = income;
        this.expenses = expenses;
        this.surplus = surplus;
        this.savingsRate = savingsRate;
        this.incomeTransactions = incomeTransactions;
        this.expenseTransactions = expenseTransactions;
        this.netWorth = netWorth;
        this.assets = assets;
        this.liabilities = liabilities;
        this.playerTotalXp = playerTotalXp;
        this.playerLevel = playerLevel;
        this.playerLevelName = playerLevelName;
        this.unlockedAchievements = unlockedAchievements;
        this.totalAchievements = totalAchievements;
        this.snapshotAssets = new ArrayList<>(snapshotAssets);
        this.snapshotGoals = new ArrayList<>(snapshotGoals);
        this.snapshotLiabilities = new ArrayList<>(snapshotLiabilities);
    }

    public Long getId() { return id; }
    public String getMonth() { return month; }
    public Instant getClosedAt() { return closedAt; }
    public BigDecimal getIncome() { return income; }
    public BigDecimal getExpenses() { return expenses; }
    public BigDecimal getSurplus() { return surplus; }
    public BigDecimal getSavingsRate() { return savingsRate; }
    public int getIncomeTransactions() { return incomeTransactions; }
    public int getExpenseTransactions() { return expenseTransactions; }
    public BigDecimal getNetWorth() { return netWorth; }
    public BigDecimal getAssets() { return assets; }
    public BigDecimal getLiabilities() { return liabilities; }
    public int getPlayerTotalXp() { return playerTotalXp; }
    public int getPlayerLevel() { return playerLevel; }
    public String getPlayerLevelName() { return playerLevelName; }
    public int getUnlockedAchievements() { return unlockedAchievements; }
    public int getTotalAchievements() { return totalAchievements; }

    public List<MonthlySnapshotAsset> getSnapshotAssets() {
        return snapshotAssets;
    }

    public List<MonthlySnapshotGoal> getSnapshotGoals() {
        return snapshotGoals;
    }

    public List<MonthlySnapshotLiability> getSnapshotLiabilities() {
        return snapshotLiabilities;
    }
}