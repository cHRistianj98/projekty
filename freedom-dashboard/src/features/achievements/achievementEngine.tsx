import {
  Award,
  Crown,
  Flame,
  Gem,
  Medal,
  PiggyBank,
  Rocket,
  ShieldCheck,
  Target,
  Trophy,
  WalletCards,
  Zap,
} from "lucide-react";

import type { ReactNode } from "react";
import type { MonthlyBudget } from "../../types/Cashflow";
import type { Asset } from "../../types/Asset";
import type { Goal } from "../../types/Goal";
import type { Liability } from "../../types/Liability";

export type AchievementCategory =
  | "wealth"
  | "cashflow"
  | "investing"
  | "goals"
  | "debt";

export type AchievementRarity =
  | "common"
  | "rare"
  | "epic"
  | "legendary";

export type Achievement = {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  xp: number;
  unlocked: boolean;
  progress: number;
  current: number;
  target: number;
  unit: "money" | "percent" | "count";
  icon: ReactNode;
};

export type AchievementEngineInput = {
  netWorth: number;
  portfolio: Asset[];
  goals: Goal[];
  liabilities: Liability[];
  monthlyBudget: MonthlyBudget;
};

export function getAchievements({
  netWorth,
  portfolio,
  goals,
  liabilities,
  monthlyBudget,
}: AchievementEngineInput): Achievement[] {
  const currentMonth = getCurrentMonth();

  const currentIncome = monthlyBudget.incomes
    .filter((income) => income.date?.startsWith(currentMonth))
    .reduce((sum, income) => sum + income.amount, 0);

  const currentExpenses = monthlyBudget.expenses
    .filter((expense) => expense.date?.startsWith(currentMonth))
    .reduce((sum, expense) => sum + expense.amount, 0);

  const currentSurplus = currentIncome - currentExpenses;

  const savingsRate =
    currentIncome > 0
      ? (currentSurplus / currentIncome) * 100
      : 0;

  const investedAssets = portfolio.reduce(
    (sum, asset) => sum + asset.value,
    0
  );

  return buildAchievements({
    netWorth,
    savingsRate,
    currentSurplus,
    investedAssets,
    positiveMonths: calculatePositiveMonths(monthlyBudget),
    completedGoals: calculateCompletedGoals(goals),
    paidLiabilities: calculatePaidLiabilities(liabilities),
  });
}

export function calculateTotalAchievementXp(
  achievements: Achievement[]
) {
  return achievements
    .filter((achievement) => achievement.unlocked)
    .reduce((sum, achievement) => sum + achievement.xp, 0);
}

export function calculatePlayerLevel(totalXp: number) {
  const levels = [
    { level: 1, name: "Rookie", xp: 0 },
    { level: 2, name: "Planner", xp: 250 },
    { level: 3, name: "Saver", xp: 600 },
    { level: 4, name: "Builder", xp: 1_000 },
    { level: 5, name: "Investor", xp: 1_600 },
    { level: 6, name: "Strategist", xp: 2_500 },
    { level: 7, name: "Capitalist", xp: 4_000 },
    { level: 8, name: "Mogul", xp: 6_500 },
    { level: 9, name: "Tycoon", xp: 10_000 },
    { level: 10, name: "FREE", xp: 15_000 },
  ];

  let current = levels[0];

  for (const level of levels) {
    if (totalXp >= level.xp) current = level;
  }

  const currentIndex = levels.findIndex(
    (level) => level.level === current.level
  );

  const next = levels[currentIndex + 1];

  if (!next) {
    return {
      level: current.level,
      name: current.name,
      currentXp: totalXp,
      requiredXp: totalXp,
      remainingXp: 0,
      progress: 100,
    };
  }

  const xpInsideLevel = totalXp - current.xp;
  const levelSize = next.xp - current.xp;

  return {
    level: current.level,
    name: current.name,
    currentXp: xpInsideLevel,
    requiredXp: levelSize,
    remainingXp: next.xp - totalXp,
    progress: (xpInsideLevel / levelSize) * 100,
  };
}

function buildAchievements({
  netWorth,
  savingsRate,
  currentSurplus,
  investedAssets,
  positiveMonths,
  completedGoals,
  paidLiabilities,
}: {
  netWorth: number;
  savingsRate: number;
  currentSurplus: number;
  investedAssets: number;
  positiveMonths: number;
  completedGoals: number;
  paidLiabilities: number;
}): Achievement[] {
  return [
    createAchievement({
      id: "wealth-10k",
      name: "First Capital",
      description: "Zbuduj pierwsze 10 000 zł majątku netto.",
      category: "wealth",
      rarity: "common",
      xp: 50,
      current: netWorth,
      target: 10_000,
      unit: "money",
      icon: <PiggyBank size={22} />,
    }),
    createAchievement({
      id: "wealth-30k",
      name: "Safety Shield",
      description: "Przekrocz 30 000 zł majątku netto.",
      category: "wealth",
      rarity: "common",
      xp: 75,
      current: netWorth,
      target: 30_000,
      unit: "money",
      icon: <ShieldCheck size={22} />,
    }),
    createAchievement({
      id: "wealth-100k",
      name: "100K Club",
      description: "Przekrocz 100 000 zł majątku netto.",
      category: "wealth",
      rarity: "rare",
      xp: 250,
      current: netWorth,
      target: 100_000,
      unit: "money",
      icon: <Gem size={22} />,
    }),
    createAchievement({
      id: "wealth-250k",
      name: "Builder",
      description: "Zbuduj ćwierć miliona złotych majątku.",
      category: "wealth",
      rarity: "rare",
      xp: 400,
      current: netWorth,
      target: 250_000,
      unit: "money",
      icon: <Award size={22} />,
    }),
    createAchievement({
      id: "wealth-500k",
      name: "Accelerator",
      description: "Przekrocz 500 000 zł majątku netto.",
      category: "wealth",
      rarity: "epic",
      xp: 650,
      current: netWorth,
      target: 500_000,
      unit: "money",
      icon: <Rocket size={22} />,
    }),
    createAchievement({
      id: "wealth-1m",
      name: "Millionaire",
      description: "Osiągnij 1 000 000 zł majątku netto.",
      category: "wealth",
      rarity: "legendary",
      xp: 1_000,
      current: netWorth,
      target: 1_000_000,
      unit: "money",
      icon: <Crown size={24} />,
    }),
    createAchievement({
      id: "wealth-3m",
      name: "FREE",
      description: "Osiągnij 3 000 000 zł i główny cel FREEDOM.",
      category: "wealth",
      rarity: "legendary",
      xp: 3_000,
      current: netWorth,
      target: 3_000_000,
      unit: "money",
      icon: <Trophy size={24} />,
    }),
    createAchievement({
      id: "savings-50",
      name: "Savings Machine",
      description:
        "Osiągnij minimum 50% savings rate w bieżącym miesiącu.",
      category: "cashflow",
      rarity: "rare",
      xp: 150,
      current: savingsRate,
      target: 50,
      unit: "percent",
      icon: <PiggyBank size={22} />,
    }),
    createAchievement({
      id: "surplus-10k",
      name: "Cashflow Machine",
      description:
        "Wypracuj co najmniej 10 000 zł miesięcznej nadwyżki.",
      category: "cashflow",
      rarity: "rare",
      xp: 200,
      current: currentSurplus,
      target: 10_000,
      unit: "money",
      icon: <Flame size={22} />,
    }),
    createAchievement({
      id: "surplus-20k",
      name: "Monster Month",
      description: "Wypracuj 20 000 zł nadwyżki w jednym miesiącu.",
      category: "cashflow",
      rarity: "epic",
      xp: 350,
      current: currentSurplus,
      target: 20_000,
      unit: "money",
      icon: <Zap size={22} />,
    }),
    createAchievement({
      id: "positive-3",
      name: "Consistency",
      description: "Zakończ 3 miesiące z dodatnim cashflow.",
      category: "cashflow",
      rarity: "rare",
      xp: 200,
      current: positiveMonths,
      target: 3,
      unit: "count",
      icon: <Flame size={22} />,
    }),
    createAchievement({
      id: "invested-100k",
      name: "Investor",
      description:
        "Zbuduj portfel aktywów o wartości 100 000 zł.",
      category: "investing",
      rarity: "rare",
      xp: 250,
      current: investedAssets,
      target: 100_000,
      unit: "money",
      icon: <WalletCards size={22} />,
    }),
    createAchievement({
      id: "invested-250k",
      name: "Compound Engine",
      description:
        "Zbuduj portfel aktywów o wartości 250 000 zł.",
      category: "investing",
      rarity: "epic",
      xp: 500,
      current: investedAssets,
      target: 250_000,
      unit: "money",
      icon: <Gem size={22} />,
    }),
    createAchievement({
      id: "goal-1",
      name: "Goal Crusher",
      description: "Ukończ pierwszy cel finansowy.",
      category: "goals",
      rarity: "rare",
      xp: 200,
      current: completedGoals,
      target: 1,
      unit: "count",
      icon: <Target size={22} />,
    }),
    createAchievement({
      id: "debt-1",
      name: "Debt Destroyer",
      description: "Spłać pierwsze zobowiązanie.",
      category: "debt",
      rarity: "epic",
      xp: 300,
      current: paidLiabilities,
      target: 1,
      unit: "count",
      icon: <Medal size={22} />,
    }),
  ];
}

function createAchievement(
  data: Omit<Achievement, "unlocked" | "progress">
): Achievement {
  const safeCurrent = Math.max(data.current, 0);

  return {
    ...data,
    current: safeCurrent,
    unlocked: safeCurrent >= data.target,
    progress:
      data.target > 0
        ? Math.min((safeCurrent / data.target) * 100, 100)
        : 0,
  };
}

function calculatePositiveMonths(budget: MonthlyBudget) {
  const months = new Set<string>();

  budget.incomes.forEach((income) => {
    if (income.date) months.add(income.date.slice(0, 7));
  });

  budget.expenses.forEach((expense) => {
    if (expense.date) months.add(expense.date.slice(0, 7));
  });

  let positive = 0;

  months.forEach((month) => {
    const income = budget.incomes
      .filter((item) => item.date?.startsWith(month))
      .reduce((sum, item) => sum + item.amount, 0);

    const expenses = budget.expenses
      .filter((item) => item.date?.startsWith(month))
      .reduce((sum, item) => sum + item.amount, 0);

    if (income > expenses) positive++;
  });

  return positive;
}

function calculateCompletedGoals(goals: Goal[]) {
  return goals.filter((goal) => {
    const item = goal as unknown as Record<string, unknown>;

    const current = getNumericProperty(item, [
      "currentAmount",
      "current",
      "savedAmount",
    ]);

    const target = getNumericProperty(item, [
      "targetAmount",
      "target",
      "amount",
    ]);

    return (
      current !== null &&
      target !== null &&
      target > 0 &&
      current >= target
    );
  }).length;
}

function calculatePaidLiabilities(liabilities: Liability[]) {
  return liabilities.filter(
    (liability) => liability.remainingAmount <= 0
  ).length;
}

function getNumericProperty(
  object: Record<string, unknown>,
  keys: string[]
) {
  for (const key of keys) {
    const value = object[key];
    if (typeof value === "number") return value;
  }

  return null;
}

function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
}
