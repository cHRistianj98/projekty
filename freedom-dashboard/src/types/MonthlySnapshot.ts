import type { AssetCategory } from "./Asset";
import type { GoalPriority, GoalType } from "./Goal";
import type { LiabilityType } from "./Liability";

export type MonthlyGoalSnapshot = {
  id: number;
  name: string;
  currentAmount: number;
  targetAmount: number;
  monthlyContribution: number;
  targetDate?: string;
  priority?: GoalPriority;
  type?: GoalType;
};

export type MonthlyLiabilitySnapshot = {
  id: number;
  name: string;
  type?: LiabilityType;
  originalAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  principalPayment: number;
  interestPayment: number;
  interestRate: number;
};

export type MonthlyAssetSnapshot = {
  id: number;
  name: string;
  value: number;
  category?: AssetCategory;
};

export type MonthlyPlayerSnapshot = {
  totalXp: number;
  level: number;
  levelName: string;
  unlockedAchievements: number;
  totalAchievements: number;
};

export type MonthlySnapshot = {
  id: number;
  month: string;
  closedAt: string;

  cashflow: {
    income: number;
    expenses: number;
    surplus: number;
    savingsRate: number;
    incomeTransactions: number;
    expenseTransactions: number;
  };

  wealth: {
    netWorth: number;
    assets: number;
    liabilities: number;
  };

  assets: MonthlyAssetSnapshot[];
  goals: MonthlyGoalSnapshot[];
  liabilities: MonthlyLiabilitySnapshot[];
  player: MonthlyPlayerSnapshot;
};
