import {
  calculatePlayerLevel,
  calculateTotalAchievementXp,
  getAchievements,
} from "../achievements/achievementEngine";

import type { Asset } from "../../types/Asset";
import type { Goal } from "../../types/Goal";
import type { Liability } from "../../types/Liability";
import type { MonthlyBudget } from "../../types/Cashflow";
import type { MonthlySnapshot } from "../../types/MonthlySnapshot";

type CreateMonthlySnapshotInput = {
  month: string;
  netWorth: number;
  portfolio: Asset[];
  goals: Goal[];
  liabilities: Liability[];
  monthlyBudget: MonthlyBudget;
};

export function createMonthlySnapshot({
  month,
  netWorth,
  portfolio,
  goals,
  liabilities,
  monthlyBudget,
}: CreateMonthlySnapshotInput): MonthlySnapshot {
  const incomes = monthlyBudget.incomes.filter(
    (income) => income.date?.slice(0, 7) === month
  );

  const expenses = monthlyBudget.expenses.filter(
    (expense) => expense.date?.slice(0, 7) === month
  );

  const income = sum(incomes.map((item) => item.amount));
  const expense = sum(expenses.map((item) => item.amount));
  const surplus = income - expense;
  const savingsRate = income > 0 ? (surplus / income) * 100 : 0;

  const totalAssets = sum(portfolio.map((item) => item.value));
  const totalLiabilities = sum(
    liabilities.map((item) => Math.max(item.remainingAmount, 0))
  );

  const achievements = getAchievements({
    netWorth,
    portfolio,
    goals,
    liabilities,
    monthlyBudget,
  });

  const totalXp = calculateTotalAchievementXp(achievements);
  const playerLevel = calculatePlayerLevel(totalXp);

  return {
    id: Date.now(),
    month,
    closedAt: new Date().toISOString(),

    cashflow: {
      income,
      expenses: expense,
      surplus,
      savingsRate,
      incomeTransactions: incomes.length,
      expenseTransactions: expenses.length,
    },

    wealth: {
      netWorth,
      assets: totalAssets,
      liabilities: totalLiabilities,
    },

    assets: portfolio.map((item) => ({
      id: item.id,
      name: item.name,
      value: item.value,
      category: item.category,
    })),

    goals: goals.map((goal) => ({
      id: goal.id,
      name: goal.name,
      currentAmount: goal.currentAmount,
      targetAmount: goal.targetAmount,
      monthlyContribution: goal.monthlyContribution,
      targetDate: goal.targetDate,
      priority: goal.priority,
      type: goal.type,
    })),

    liabilities: liabilities.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      originalAmount: item.originalAmount,
      remainingAmount: item.remainingAmount,
      monthlyPayment: item.monthlyPayment,
      principalPayment: item.principalPayment,
      interestPayment: item.interestPayment,
      interestRate: item.interestRate,
    })),

    player: {
      totalXp,
      level: playerLevel.level,
      levelName: playerLevel.name,
      unlockedAchievements: achievements.filter(
        (achievement) => achievement.unlocked
      ).length,
      totalAchievements: achievements.length,
    },
  };
}

export function upsertMonthlySnapshot(
  snapshots: MonthlySnapshot[],
  snapshot: MonthlySnapshot
) {
  const existing = snapshots.some(
    (item) => item.month === snapshot.month
  );

  if (!existing) {
    return [...snapshots, snapshot].sort((a, b) =>
      a.month.localeCompare(b.month)
    );
  }

  return snapshots
    .map((item) =>
      item.month === snapshot.month ? snapshot : item
    )
    .sort((a, b) => a.month.localeCompare(b.month));
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
