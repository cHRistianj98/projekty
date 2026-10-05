import { assetApi } from "../api/assetApi";
import { budgetApi } from "../api/budgetApi";
import { categoryApi } from "../api/categoryApi";
import { goalAllocationApi } from "../api/goalAllocationApi";
import { goalApi } from "../api/goalApi";
import { liabilityAllocationApi } from "../api/liabilityAllocationApi";
import { liabilityApi } from "../api/liabilityApi";
import { monthlySnapshotApi } from "../api/monthlySnapshotApi";
import { netWorthHistoryApi } from "../api/netWorthHistoryApi";
import { portfolioApi } from "../api/portfolioApi";
import { recurringTransactionApi } from "../api/recurringTransactionApi";
import { transactionApi } from "../api/transactionApi";

import type { Asset } from "../types/Asset";
import type { MonthlyBudgetPlan } from "../types/Budget";
import type { Category, CategoryGroup, CategoryType } from "../types/Category";
import type { Expense, ExpenseCategory, Income, MonthlyBudget } from "../types/Cashflow";
import type { Goal } from "../types/Goal";
import type { Liability } from "../types/Liability";
import type { MonthlySnapshot } from "../types/MonthlySnapshot";
import type { NetWorthSnapshot } from "../types/NetWorthHistory";
import type { PortfolioInput, PortfolioWallet } from "../types/Portfolio";
import type { RecurringTransaction } from "../types/RecurringTransaction";

type DemoPortfolioKey =
  | "MAIN"
  | "LONG_TERM"
  | "EMERGENCY"
  | "HOME"
  | "SHORT_TERM"
  | "DEBT";

type DemoAssetKey =
  | "APARTMENT"
  | "CAR"
  | "USD"
  | "WORLD_ETF"
  | "SP500_ETF"
  | "BTC"
  | "ETH"
  | "GOLD"
  | "EMERGENCY_CASH"
  | "HOME_CASH"
  | "CAR_GOAL_CASH"
  | "TRAVEL_CASH"
  | "DENTAL_CASH"
  | "DEBT_CASH";

type DemoGoalKey = "EMERGENCY" | "HOME" | "CAR" | "TRAVEL" | "DENTAL";
type DemoLiabilityKey = "MORTGAGE" | "CAR_LOAN";
type DemoRuleKey =
  | "SALARY"
  | "HOUSING"
  | "MORTGAGE"
  | "CAR_LOAN"
  | "INTERNET"
  | "PHONE"
  | "SUBSCRIPTIONS"
  | "GYM"
  | "DANCE";

type DemoPortfolioSeed = {
  key: Exclude<DemoPortfolioKey, "MAIN">;
  input: PortfolioInput;
};

type DemoAssetSeed = {
  key: Exclude<DemoAssetKey, "USD">;
  portfolioKey: DemoPortfolioKey;
  values: readonly [number, number, number, number, number, number];
  asset: Omit<Asset, "id" | "value" | "portfolioId">;
};

type DemoGoalSeed = {
  key: DemoGoalKey;
  targetAssetKey: DemoAssetKey;
  contributions: readonly [number, number, number, number, number, number];
  goal: Omit<Goal, "id" | "currentAmount">;
};

type DemoLiabilitySeed = {
  key: DemoLiabilityKey;
  remaining: readonly [number, number, number, number, number, number];
  liability: Omit<Liability, "id" | "remainingAmount">;
};

type DemoRuleSeed = {
  key: DemoRuleKey;
  rule: Omit<RecurringTransaction, "id" | "startDate">;
};

type DemoTransactionSeed = {
  kind: "income" | "expense";
  day: number;
  name: string;
  amount: number;
  categorySlug: string;
  recurringKey?: DemoRuleKey;
};

export type DemoDataLoadResult = {
  assets: Asset[];
  liabilities: Liability[];
  goals: Goal[];
  monthlyBudget: MonthlyBudget;
  recurringTransactions: RecurringTransaction[];
  netWorthHistory: NetWorthSnapshot[];
  monthlySnapshots: MonthlySnapshot[];
  budgetPlans: MonthlyBudgetPlan[];
  warnings: string[];
  stats: {
    portfolios: number;
    assets: number;
    goals: number;
    liabilities: number;
    incomes: number;
    expenses: number;
    closedMonths: number;
  };
};

const portfolioSeeds: DemoPortfolioSeed[] = [
  {
    key: "LONG_TERM",
    input: {
      name: "Długoterminowy",
      color: "#3b82f6",
      iconKey: "chart",
      targetAmount: 500_000,
      monthlyContribution: 3_500,
      imageUrl: "/portfolios/long-term.webp",
      imagePosition: "center",
    },
  },
  {
    key: "EMERGENCY",
    input: {
      name: "Poduszka bezpieczeństwa",
      color: "#10b981",
      iconKey: "shield",
      targetAmount: 60_000,
      monthlyContribution: 1_500,
      imageUrl: "/portfolios/emergency-fund.webp",
      imagePosition: "center",
    },
  },
  {
    key: "HOME",
    input: {
      name: "Wkład własny",
      color: "#8b5cf6",
      iconKey: "house",
      targetAmount: 220_000,
      monthlyContribution: 3_500,
      imageUrl: "/portfolios/main.webp",
      imagePosition: "center",
    },
  },
  {
    key: "SHORT_TERM",
    input: {
      name: "Cele krótkoterminowe",
      color: "#f59e0b",
      iconKey: "target",
      targetAmount: 80_000,
      monthlyContribution: 2_000,
      imageUrl: "/portfolios/short-term.webp",
      imagePosition: "center",
    },
  },
  {
    key: "DEBT",
    input: {
      name: "Nadpłata kredytu",
      color: "#ef4444",
      iconKey: "landmark",
      targetAmount: 50_000,
      monthlyContribution: 1_200,
      imageUrl: "/portfolios/debt-payoff.webp",
      imagePosition: "center",
    },
  },
];

const assetSeeds: DemoAssetSeed[] = [
  {
    key: "APARTMENT",
    portfolioKey: "MAIN",
    values: [690_000, 692_000, 695_000, 698_000, 702_000, 705_000],
    asset: {
      name: "Mieszkanie testowe",
      color: "#7c3aed",
      category: "realEstate",
      iconKey: "building",
      marketPriced: false,
    },
  },
  {
    key: "CAR",
    portfolioKey: "MAIN",
    values: [72_000, 70_500, 69_000, 67_500, 66_000, 64_500],
    asset: {
      name: "Samochód testowy",
      color: "#64748b",
      category: "vehicle",
      iconKey: "car",
    },
  },
  {
    key: "WORLD_ETF",
    portfolioKey: "LONG_TERM",
    values: [118_000, 121_000, 119_500, 125_000, 129_000, 132_500],
    asset: {
      name: "ETF MSCI World",
      color: "#2563eb",
      category: "stocks",
      iconKey: "chart",
      stockPriced: false,
    },
  },
  {
    key: "SP500_ETF",
    portfolioKey: "LONG_TERM",
    values: [46_000, 47_200, 46_800, 49_000, 50_200, 52_000],
    asset: {
      name: "ETF S&P 500",
      color: "#0ea5e9",
      category: "stocks",
      iconKey: "trendingUp",
      stockPriced: false,
    },
  },
  {
    key: "BTC",
    portfolioKey: "LONG_TERM",
    values: [32_000, 35_000, 31_000, 38_000, 41_000, 39_000],
    asset: {
      name: "Bitcoin — pozycja testowa",
      color: "#f97316",
      category: "crypto",
      iconKey: "bitcoin",
      marketPriced: false,
    },
  },
  {
    key: "ETH",
    portfolioKey: "LONG_TERM",
    values: [12_000, 13_000, 11_500, 14_200, 15_500, 14_800],
    asset: {
      name: "Ethereum — pozycja testowa",
      color: "#6366f1",
      category: "crypto",
      iconKey: "circleDollar",
      marketPriced: false,
    },
  },
  {
    key: "GOLD",
    portfolioKey: "LONG_TERM",
    values: [18_000, 18_300, 18_100, 18_700, 19_000, 19_400],
    asset: {
      name: "Złoto inwestycyjne",
      color: "#eab308",
      category: "metals",
      iconKey: "goldBars",
      marketPriced: false,
    },
  },
  {
    key: "EMERGENCY_CASH",
    portfolioKey: "EMERGENCY",
    values: [32_000, 34_500, 37_000, 39_500, 42_000, 45_000],
    asset: {
      name: "Konto poduszki",
      color: "#10b981",
      category: "cash",
      iconKey: "vault",
    },
  },
  {
    key: "HOME_CASH",
    portfolioKey: "HOME",
    values: [42_000, 46_500, 51_000, 55_500, 60_000, 65_000],
    asset: {
      name: "Kapitał na wkład własny",
      color: "#8b5cf6",
      category: "cash",
      iconKey: "piggyBank",
    },
  },
  {
    key: "CAR_GOAL_CASH",
    portfolioKey: "SHORT_TERM",
    values: [14_000, 16_000, 18_000, 20_500, 23_000, 26_000],
    asset: {
      name: "Fundusz samochodowy",
      color: "#3b82f6",
      category: "cash",
      iconKey: "car",
    },
  },
  {
    key: "TRAVEL_CASH",
    portfolioKey: "SHORT_TERM",
    values: [5_000, 6_500, 8_000, 9_500, 11_000, 13_000],
    asset: {
      name: "Fundusz podróżniczy",
      color: "#f59e0b",
      category: "cash",
      iconKey: "wallet",
    },
  },
  {
    key: "DENTAL_CASH",
    portfolioKey: "SHORT_TERM",
    values: [9_000, 10_500, 12_000, 13_500, 15_000, 16_500],
    asset: {
      name: "Rezerwa zdrowotna",
      color: "#ec4899",
      category: "cash",
      iconKey: "shield",
    },
  },
  {
    key: "DEBT_CASH",
    portfolioKey: "DEBT",
    values: [8_000, 9_500, 11_000, 12_500, 14_000, 15_500],
    asset: {
      name: "Rezerwa na nadpłatę",
      color: "#ef4444",
      category: "cash",
      iconKey: "banknote",
    },
  },
];

const goalSeeds: DemoGoalSeed[] = [
  {
    key: "EMERGENCY",
    targetAssetKey: "EMERGENCY_CASH",
    contributions: [30_000, 2_000, 2_000, 2_000, 2_000, 2_000],
    goal: {
      name: "Poduszka bezpieczeństwa 60K",
      targetAmount: 60_000,
      monthlyContribution: 1_500,
      priority: "HIGH",
      type: "EMERGENCY_FUND",
      color: "#10b981",
      imageUrl: "/goals/emergency-fund.webp",
      imagePosition: "center",
    },
  },
  {
    key: "HOME",
    targetAssetKey: "HOME_CASH",
    contributions: [38_000, 3_000, 3_000, 3_500, 3_500, 4_000],
    goal: {
      name: "Wkład własny na drugie mieszkanie",
      targetAmount: 220_000,
      monthlyContribution: 3_500,
      priority: "HIGH",
      type: "SECOND_PROPERTY",
      color: "#8b5cf6",
      imageUrl: "/goals/second-property.webp",
      imagePosition: "center",
    },
  },
  {
    key: "CAR",
    targetAssetKey: "CAR_GOAL_CASH",
    contributions: [12_000, 1_500, 1_500, 2_000, 2_000, 2_000],
    goal: {
      name: "Samochód klasy premium",
      targetAmount: 120_000,
      monthlyContribution: 1_800,
      priority: "MEDIUM",
      type: "CAR",
      color: "#3b82f6",
      imageUrl: "/goals/car.webp",
      imagePosition: "center",
    },
  },
  {
    key: "TRAVEL",
    targetAssetKey: "TRAVEL_CASH",
    contributions: [4_000, 1_000, 1_000, 1_200, 1_300, 1_500],
    goal: {
      name: "Japonia 2027",
      targetAmount: 20_000,
      monthlyContribution: 900,
      priority: "LOW",
      type: "TRAVEL",
      color: "#f59e0b",
      imageUrl: "/goals/travel.webp",
      imagePosition: "center",
    },
  },
  {
    key: "DENTAL",
    targetAssetKey: "DENTAL_CASH",
    contributions: [8_000, 1_000, 1_000, 1_000, 1_000, 1_000],
    goal: {
      name: "Leczenie stomatologiczne",
      targetAmount: 25_000,
      monthlyContribution: 1_200,
      priority: "HIGH",
      type: "DENTAL",
      color: "#ec4899",
      imageUrl: "/goals/dental.webp",
      imagePosition: "center",
    },
  },
];

const liabilitySeeds: DemoLiabilitySeed[] = [
  {
    key: "MORTGAGE",
    remaining: [431_000, 428_900, 426_800, 424_700, 422_600, 420_500],
    liability: {
      name: "Kredyt hipoteczny — test",
      type: "MORTGAGE",
      originalAmount: 480_000,
      monthlyPayment: 2_950,
      principalPayment: 2_100,
      interestPayment: 850,
      interestRate: 5.8,
      imageUrl: "/liabilities/house.webp",
      imagePosition: "center",
      iconKey: "house",
    },
  },
  {
    key: "CAR_LOAN",
    remaining: [55_500, 54_300, 53_100, 51_900, 50_700, 49_500],
    liability: {
      name: "Kredyt samochodowy — test",
      type: "CAR_LOAN",
      originalAmount: 75_000,
      monthlyPayment: 1_450,
      principalPayment: 1_200,
      interestPayment: 250,
      interestRate: 7.4,
      imageUrl: "/liabilities/car.webp",
      imagePosition: "center",
      iconKey: "car",
    },
  },
];

const recurringRuleSeeds: DemoRuleSeed[] = [
  { key: "SALARY", rule: { type: "income", name: "Wynagrodzenie", amount: 19_500, dayOfMonth: 1, active: true } },
  { key: "HOUSING", rule: { type: "expense", name: "Czynsz i wspólnota", amount: 1_450, category: "fixed", dayOfMonth: 2, active: true } },
  { key: "MORTGAGE", rule: { type: "expense", name: "Rata kredytu hipotecznego", amount: 2_950, category: "fixed", dayOfMonth: 3, active: true } },
  { key: "CAR_LOAN", rule: { type: "expense", name: "Rata kredytu samochodowego", amount: 1_450, category: "fixed", dayOfMonth: 4, active: true } },
  { key: "INTERNET", rule: { type: "expense", name: "Internet", amount: 89, category: "fixed", dayOfMonth: 5, active: true } },
  { key: "PHONE", rule: { type: "expense", name: "Telefon", amount: 65, category: "fixed", dayOfMonth: 6, active: true } },
  { key: "SUBSCRIPTIONS", rule: { type: "expense", name: "Subskrypcje", amount: 169, category: "fixed", dayOfMonth: 7, active: true } },
  { key: "GYM", rule: { type: "expense", name: "Siłownia", amount: 179, category: "living", dayOfMonth: 8, active: true } },
  { key: "DANCE", rule: { type: "expense", name: "Tańce", amount: 320, category: "living", dayOfMonth: 9, active: true } },
];

const salaryByMonth = [18_000, 18_000, 18_500, 19_000, 19_000, 19_500] as const;
const sideIncomeByMonth = [0, 2_400, 0, 3_100, 1_800, 0] as const;
const interestIncomeByMonth = [90, 105, 112, 118, 125, 132] as const;
const electricityByMonth = [248, 276, 231, 292, 265, 255] as const;
const eatingOutByMonth = [420, 510, 465, 620, 545, 490] as const;
const transportOneByMonth = [380, 420, 395, 460, 435, 410] as const;
const transportTwoByMonth = [265, 290, 310, 340, 315, 300] as const;
const groceriesOneByMonth = [720, 760, 745, 790, 810, 785] as const;
const groceriesTwoByMonth = [690, 735, 710, 760, 780, 750] as const;
const groceriesThreeByMonth = [280, 315, 290, 330, 345, 320] as const;
const investmentsByMonth = [1_800, 2_000, 2_000, 2_200, 2_200, 2_300] as const;
const rotatingExpense = [
  { name: "Kurs zawodowy", amount: 650, categorySlug: "development" },
  { name: "Weekendowy wyjazd", amount: 1_400, categorySlug: "trips" },
  { name: "Ubrania", amount: 780, categorySlug: "clothes" },
  { name: "Kontrola stomatologiczna", amount: 950, categorySlug: "dentist" },
  { name: "Sprzęt do domu", amount: 1_250, categorySlug: "equipment" },
  { name: "Badania profilaktyczne", amount: 450, categorySlug: "health" },
] as const;

export async function loadSyntheticDemoData(now = new Date()): Promise<DemoDataLoadResult> {
  const warnings: string[] = [];
  const months = buildSixMonthWindow(now);
  const currentDay = now.getDate();

  const existingSnapshots = await monthlySnapshotApi.getAll();
  if (existingSnapshots.length > 0) {
    warnings.push(
      "Konto ma już zamknięte miesiące. Loader nie usuwa historycznych snapshotów; dla idealnie czystego testu użyj świeżego konta."
    );
  }

  await clearEditableData();

  const categories = await categoryApi.getAll();
  const categoryIndex = buildCategoryIndex(categories);

  const wallets = await portfolioApi.getAll();
  const mainWallet = wallets.find((wallet) => wallet.type === "MAIN" && wallet.systemPortfolio);
  if (!mainWallet) throw new Error("Brak systemowego portfela Główny.");

  const walletByKey = new Map<DemoPortfolioKey, PortfolioWallet>([["MAIN", mainWallet]]);
  for (const seed of portfolioSeeds) {
    walletByKey.set(seed.key, await portfolioApi.create(seed.input));
  }

  const recurringByKey = new Map<DemoRuleKey, RecurringTransaction>();
  for (const seed of recurringRuleSeeds) {
    const created = await recurringTransactionApi.create({
      id: 0,
      startDate: dateInMonth(months[0], seed.rule.dayOfMonth),
      ...seed.rule,
    });
    recurringByKey.set(seed.key, created);
  }

  const assetByKey = new Map<DemoAssetKey, Asset>();
  for (const seed of assetSeeds) {
    const wallet = walletByKey.get(seed.portfolioKey);
    if (!wallet) throw new Error(`Brak portfela ${seed.portfolioKey}.`);
    const created = await assetApi.create({
      id: 0,
      value: seed.values[0],
      portfolioId: wallet.id,
      ...seed.asset,
    });
    assetByKey.set(seed.key, created);
  }

  // One live FX position is useful for checking the 24h / 1M badges. The holding
  // itself is synthetic; if the pricing provider is unavailable, the demo still
  // loads with a deterministic manual-cash fallback.
  const mainWalletId = walletByKey.get("MAIN")!.id;
  try {
    const usd = await assetApi.create({
      id: 0,
      name: "Dolary (USD) — pozycja testowa",
      value: 0,
      color: "#22c55e",
      category: "cash",
      iconKey: "circleDollar",
      portfolioId: mainWalletId,
      fxPriced: true,
      cashCurrency: "USD",
      cashQuantity: 4_200,
    });
    assetByKey.set("USD", usd);
  } catch (error) {
    console.warn("Demo FX pricing unavailable, using manual USD fallback:", error);
    warnings.push("Nie udało się pobrać kursu USD — utworzono ręczną pozycję testową bez badge 24h/1M.");
    const usd = await assetApi.create({
      id: 0,
      name: "Dolary (USD) — pozycja testowa",
      value: 15_500,
      color: "#22c55e",
      category: "cash",
      iconKey: "circleDollar",
      portfolioId: mainWalletId,
      fxPriced: false,
    });
    assetByKey.set("USD", usd);
  }

  const goalByKey = new Map<DemoGoalKey, Goal>();
  for (const seed of goalSeeds) {
    const created = await goalApi.create({
      id: 0,
      currentAmount: 0,
      targetDate: goalTargetDate(seed.key, now),
      ...seed.goal,
    });
    goalByKey.set(seed.key, created);
  }

  const liabilityByKey = new Map<DemoLiabilityKey, Liability>();
  for (const seed of liabilitySeeds) {
    const created = await liabilityApi.create({
      id: 0,
      remainingAmount: seed.remaining[0],
      ...seed.liability,
    });
    liabilityByKey.set(seed.key, created);
  }

  const createdIncomes: Income[] = [];
  const createdExpenses: Expense[] = [];
  const createdBudgetPlans: MonthlyBudgetPlan[] = [];
  const createdSnapshots: MonthlySnapshot[] = [];
  const existingSnapshotMonths = new Set(existingSnapshots.map((snapshot) => snapshot.month));

  for (let monthIndex = 0; monthIndex < months.length; monthIndex += 1) {
    if (monthIndex > 0) {
      await updateAssetState(monthIndex, assetByKey);
      await updateLiabilityState(monthIndex, liabilityByKey);
    }

    await addGoalContributions(monthIndex, goalByKey, assetByKey);

    const seeds = buildTransactionsForMonth(monthIndex);
    const isCurrentMonth = monthIndex === months.length - 1;
    const visibleSeeds = isCurrentMonth
      ? seeds.filter((seed) => seed.day <= currentDay)
      : seeds;

    for (const seed of visibleSeeds.sort((a, b) => a.day - b.day)) {
      const recurringRuleId = seed.recurringKey
        ? recurringByKey.get(seed.recurringKey)?.id
        : undefined;
      const category = requireCategory(categoryIndex, seed.kind === "income" ? "INCOME" : "EXPENSE", seed.categorySlug);
      const date = dateInMonth(months[monthIndex], seed.day);

      if (seed.kind === "income") {
        createdIncomes.push(await transactionApi.createIncome({
          id: 0,
          name: seed.name,
          amount: seed.amount,
          recurring: Boolean(seed.recurringKey),
          date,
          recurringRuleId,
          categoryId: category.id,
        }));
      } else {
        createdExpenses.push(await transactionApi.createExpense({
          id: 0,
          name: seed.name,
          amount: seed.amount,
          category: legacyExpenseCategory(category.group),
          recurring: Boolean(seed.recurringKey),
          date,
          recurringRuleId,
          categoryId: category.id,
        }));
      }
    }

    const budgetPlan = await budgetApi.save(buildBudgetPlan(months[monthIndex], categoryIndex));
    createdBudgetPlans.push(budgetPlan);

    if (!isCurrentMonth && !existingSnapshotMonths.has(months[monthIndex])) {
      createdSnapshots.push(await monthlySnapshotApi.closeMonth(months[monthIndex]));
    }
  }

  const mortgage = liabilityByKey.get("MORTGAGE");
  const debtWallet = walletByKey.get("DEBT");
  if (mortgage && debtWallet) {
    try {
      await liabilityAllocationApi.assignPortfolio(mortgage.id, debtWallet.id);
    } catch (error) {
      console.warn("Could not link demo debt portfolio:", error);
      warnings.push("Nie udało się przypisać portfela nadpłaty do kredytu hipotecznego.");
    }
  }

  const [assets, liabilities, goals, monthlyBudget, recurringTransactions] = await Promise.all([
    assetApi.getAll(),
    liabilityApi.getAll(),
    goalApi.getAll(),
    transactionApi.getAll(),
    recurringTransactionApi.getAll(),
  ]);

  const currentNetWorth =
    assets.reduce((sum, asset) => sum + asset.value, 0) -
    liabilities.reduce((sum, liability) => sum + liability.remainingAmount, 0);
  await netWorthHistoryApi.save({
    id: Number(months[months.length - 1].replace("-", "")),
    date: `${months[months.length - 1]}-01`,
    value: currentNetWorth,
  });

  const [netWorthHistory, monthlySnapshots, budgetPlans, finalWallets] = await Promise.all([
    netWorthHistoryApi.getAll(),
    monthlySnapshotApi.getAll(),
    budgetApi.getAll(),
    portfolioApi.getAll(),
  ]);

  return {
    assets,
    liabilities,
    goals,
    monthlyBudget,
    recurringTransactions,
    netWorthHistory,
    monthlySnapshots,
    budgetPlans,
    warnings,
    stats: {
      portfolios: finalWallets.filter((wallet) => wallet.type !== "GOALS").length,
      assets: assets.length,
      goals: goals.length,
      liabilities: liabilities.length,
      incomes: createdIncomes.length,
      expenses: createdExpenses.length,
      closedMonths: createdSnapshots.length,
    },
  };
}

async function clearEditableData() {
  const [budget, goals, liabilities, rules, assets] = await Promise.all([
    transactionApi.getAll(),
    goalApi.getAll(),
    liabilityApi.getAll(),
    recurringTransactionApi.getAll(),
    assetApi.getAll(),
  ]);

  for (const transaction of [...budget.incomes, ...budget.expenses]) {
    await transactionApi.remove(transaction.id);
  }

  for (const goal of goals) {
    await goalApi.remove(goal.id);
  }

  for (const liability of liabilities) {
    await liabilityApi.remove(liability.id);
  }

  for (const asset of assets.filter((item) => !item.systemCash)) {
    await assetApi.remove(asset.id);
  }

  for (const rule of rules) {
    await recurringTransactionApi.remove(rule.id);
  }

  const wallets = await portfolioApi.getAll();
  for (const wallet of wallets.filter((item) => !item.systemPortfolio)) {
    await portfolioApi.remove(wallet.id);
  }
}

async function updateAssetState(monthIndex: number, assetByKey: Map<DemoAssetKey, Asset>) {
  for (const seed of assetSeeds) {
    const current = assetByKey.get(seed.key);
    if (!current) throw new Error(`Brak aktywa demo ${seed.key}.`);
    const saved = await assetApi.update(current.id, {
      ...current,
      value: seed.values[monthIndex],
      marketPriced: false,
      fxPriced: false,
      stockPriced: false,
    });
    assetByKey.set(seed.key, saved);
  }
}

async function updateLiabilityState(monthIndex: number, liabilityByKey: Map<DemoLiabilityKey, Liability>) {
  for (const seed of liabilitySeeds) {
    const current = liabilityByKey.get(seed.key);
    if (!current) throw new Error(`Brak zobowiązania demo ${seed.key}.`);
    const saved = await liabilityApi.update(current.id, {
      ...current,
      remainingAmount: seed.remaining[monthIndex],
    });
    liabilityByKey.set(seed.key, saved);
  }
}

async function addGoalContributions(
  monthIndex: number,
  goalByKey: Map<DemoGoalKey, Goal>,
  assetByKey: Map<DemoAssetKey, Asset>
) {
  for (const seed of goalSeeds) {
    const goal = goalByKey.get(seed.key);
    const targetAsset = assetByKey.get(seed.targetAssetKey);
    const amount = seed.contributions[monthIndex];
    if (!goal || !targetAsset || amount <= 0) continue;

    await goalAllocationApi.allocate(goal.id, {
      amount,
      mode: "ALLOCATE_EXISTING",
      targetAssetId: targetAsset.id,
    });
  }
}

function buildTransactionsForMonth(monthIndex: number): DemoTransactionSeed[] {
  const rotating = rotatingExpense[monthIndex];
  const transactions: DemoTransactionSeed[] = [
    { kind: "income", day: 1, name: "Wynagrodzenie", amount: salaryByMonth[monthIndex], categorySlug: "salary", recurringKey: "SALARY" },
    { kind: "expense", day: 2, name: "Czynsz i wspólnota", amount: 1_450, categorySlug: "housing-fees", recurringKey: "HOUSING" },
    { kind: "expense", day: 3, name: "Rata kredytu hipotecznego", amount: 2_950, categorySlug: "loan", recurringKey: "MORTGAGE" },
    { kind: "expense", day: 4, name: "Rata kredytu samochodowego", amount: 1_450, categorySlug: "loan", recurringKey: "CAR_LOAN" },
    { kind: "expense", day: 5, name: "Internet", amount: 89, categorySlug: "internet", recurringKey: "INTERNET" },
    { kind: "expense", day: 6, name: "Telefon", amount: 65, categorySlug: "phone", recurringKey: "PHONE" },
    { kind: "expense", day: 7, name: "Subskrypcje", amount: 169, categorySlug: "subscriptions", recurringKey: "SUBSCRIPTIONS" },
    { kind: "expense", day: 8, name: "Siłownia", amount: 179, categorySlug: "gym", recurringKey: "GYM" },
    { kind: "expense", day: 9, name: "Tańce", amount: 320, categorySlug: "dance", recurringKey: "DANCE" },
    { kind: "expense", day: 10, name: "Zakupy spożywcze", amount: groceriesOneByMonth[monthIndex], categorySlug: "groceries" },
    { kind: "expense", day: 12, name: "Paliwo i komunikacja", amount: transportOneByMonth[monthIndex], categorySlug: "transport" },
    { kind: "expense", day: 14, name: "Prąd", amount: electricityByMonth[monthIndex], categorySlug: "electricity" },
    { kind: "expense", day: 16, name: "Zakupy spożywcze", amount: groceriesTwoByMonth[monthIndex], categorySlug: "groceries" },
    { kind: "expense", day: 18, name: "Jedzenie na mieście", amount: eatingOutByMonth[monthIndex], categorySlug: "eating-out" },
    { kind: "expense", day: 20, name: "Regularne inwestowanie", amount: investmentsByMonth[monthIndex], categorySlug: "investments" },
    { kind: "expense", day: 23, name: rotating.name, amount: rotating.amount, categorySlug: rotating.categorySlug },
    { kind: "expense", day: 24, name: "Transport dodatkowy", amount: transportTwoByMonth[monthIndex], categorySlug: "transport" },
    { kind: "expense", day: 28, name: "Zakupy spożywcze", amount: groceriesThreeByMonth[monthIndex], categorySlug: "groceries" },
    { kind: "income", day: 30, name: "Odsetki z konta", amount: interestIncomeByMonth[monthIndex], categorySlug: "interest" },
  ];

  if (sideIncomeByMonth[monthIndex] > 0) {
    transactions.push({
      kind: "income",
      day: 21,
      name: "Dodatkowe zlecenie",
      amount: sideIncomeByMonth[monthIndex],
      categorySlug: "other",
    });
  }

  return transactions;
}

function buildBudgetPlan(month: string, categoryIndex: Map<string, Category>): MonthlyBudgetPlan {
  const limits: Array<[string, number]> = [
    ["housing-fees", 1_500],
    ["loan", 4_500],
    ["internet", 100],
    ["phone", 100],
    ["subscriptions", 220],
    ["groceries", 1_950],
    ["eating-out", 650],
    ["transport", 850],
    ["electricity", 350],
    ["gym", 200],
    ["dance", 350],
    ["investments", 2_500],
    ["trips", 1_500],
    ["health", 900],
    ["development", 800],
  ];

  return {
    month,
    limits: limits.map(([slug, limit]) => {
      const category = requireCategory(categoryIndex, "EXPENSE", slug);
      return {
        categoryId: category.id,
        categoryName: category.name,
        categoryIconKey: category.iconKey,
        categoryColor: category.color,
        categoryGroup: category.group,
        limit,
      };
    }),
  };
}

function buildSixMonthWindow(now: Date) {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
}

function dateInMonth(month: string, requestedDay: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  const day = Math.min(requestedDay, lastDay);
  return `${month}-${String(day).padStart(2, "0")}`;
}

function goalTargetDate(key: DemoGoalKey, now: Date) {
  const monthsAhead: Record<DemoGoalKey, number> = {
    EMERGENCY: 10,
    HOME: 42,
    CAR: 26,
    TRAVEL: 14,
    DENTAL: 9,
  };
  const date = new Date(now.getFullYear(), now.getMonth() + monthsAhead[key], 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function buildCategoryIndex(categories: Category[]) {
  return new Map(categories.map((category) => [`${category.type}:${category.slug}`, category]));
}

function requireCategory(index: Map<string, Category>, type: CategoryType, slug: string) {
  const category = index.get(`${type}:${slug}`);
  if (!category) throw new Error(`Brak kategorii ${type}:${slug}.`);
  return category;
}

function legacyExpenseCategory(group: CategoryGroup): ExpenseCategory {
  switch (group) {
    case "FIXED":
      return "fixed";
    case "WEALTH":
      return "investment";
    case "GOALS":
      return "goal";
    default:
      return "living";
  }
}
