import type { Asset } from "../../types/Asset";
import { getAssetCategory } from "../../types/Asset";
import type { Liability } from "../../types/Liability";
import type { MonthlyBudget } from "../../types/Cashflow";
import type { AppLanguage } from "../../i18n/LanguageContext";

export type FreedomEngineInput = {
  netWorth: number;
  portfolio: Asset[];
  liabilities: Liability[];
  monthlyBudget: MonthlyBudget;
};

export type DataConfidence = "LOW" | "MEDIUM" | "HIGH";

export type FreedomScoreComponent = {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  explanation: string;
};

export type FreedomMilestone = {
  name: string;
  value: number;
  reached: boolean;
};

export type FreedomInsight = {
  type: "strength" | "mission" | "projection" | "opportunity";
  title: string;
  text: string;
};

export type FreedomEngineResult = {
  freedomTarget: number;
  freedomScore: number;
  scoreComponents: FreedomScoreComponent[];
  monthsOfHistory: number;
  dataConfidence: DataConfidence;
  rollingMonths: number;
  averageIncome: number;
  averageExpenses: number;
  averageSurplus: number;
  savingsRate: number;
  liquidAssets: number;
  investedAssets: number;
  unclassifiedAssets: number;
  totalLiabilities: number;
  investmentRatio: number;
  safetyMonths: number;
  progressToFreedom: number;
  nextMilestone: FreedomMilestone | null;
  amountToNextMilestone: number;
  monthsToNextMilestone: number | null;
  yearsToFreedom: number | null;
  projectedFreedomDate: string | null;
  milestones: FreedomMilestone[];
  intelligence: FreedomInsight[];
};

const FREEDOM_TARGET = 3_000_000;

const MILESTONES = [
  { name: "Starter", value: 100_000 },
  { name: "Builder", value: 250_000 },
  { name: "Accelerator", value: 500_000 },
  { name: "Millionaire", value: 1_000_000 },
  { name: "Independent", value: 2_000_000 },
  { name: "FREE", value: FREEDOM_TARGET },
];

export function calculateFreedomEngine({
  netWorth,
  portfolio,
  liabilities,
  monthlyBudget,
}: FreedomEngineInput, language: AppLanguage = "pl"): FreedomEngineResult {
  const ui = (pl: string, en: string) => (language === "pl" ? pl : en);
  const monthlyStats = buildMonthlyStats(monthlyBudget);
  const rolling = monthlyStats.slice(-3);
  const rollingMonths = rolling.length;

  const averageIncome = average(rolling.map((month) => month.income));
  const averageExpenses = average(rolling.map((month) => month.expenses));
  const averageSurplus = average(rolling.map((month) => month.surplus));

  const savingsRate =
    averageIncome > 0
      ? clamp((averageSurplus / averageIncome) * 100, 0, 100)
      : 0;

  const liquidAssets = portfolio
    .filter((asset) => getAssetCategory(asset) === "cash")
    .reduce((sum, asset) => sum + Math.max(asset.value, 0), 0);

  const investedAssets = portfolio
    .filter((asset) =>
      ["stocks", "crypto", "realEstate", "business", "metals"].includes(
        getAssetCategory(asset)
      )
    )
    .reduce((sum, asset) => sum + Math.max(asset.value, 0), 0);

  const unclassifiedAssets = portfolio
    .filter((asset) => !asset.category)
    .reduce((sum, asset) => sum + Math.max(asset.value, 0), 0);

  const totalAssets = portfolio.reduce(
    (sum, asset) => sum + Math.max(asset.value, 0),
    0
  );

  const totalLiabilities = liabilities.reduce(
    (sum, liability) => sum + Math.max(liability.remainingAmount, 0),
    0
  );

  const safetyMonths =
    averageExpenses > 0 ? liquidAssets / averageExpenses : 0;

  const investmentRatio =
    totalAssets > 0 ? (investedAssets / totalAssets) * 100 : 0;

  const debtToAssets =
    totalAssets > 0
      ? totalLiabilities / totalAssets
      : totalLiabilities > 0
        ? 1
        : 0;

  const wealthScore = clampScore(
    (Math.max(netWorth, 0) / FREEDOM_TARGET) * 30,
    30
  );

  const savingsScore = clampScore((savingsRate / 50) * 20, 20);

  const cashflowScore =
    averageSurplus <= 0
      ? 0
      : clampScore((averageSurplus / 10_000) * 15, 15);

  // Full score around a diversified/investment-heavy 70% of gross assets.
  const investmentScore = clampScore(
    (investmentRatio / 70) * 15,
    15
  );

  // Six months of liquid runway earns the full safety component.
  const safetyScore = clampScore((safetyMonths / 6) * 10, 10);

  // Debt is assessed against gross assets rather than invested assets.
  // 0% debt => 10/10, 50%+ debt/assets => 0/10.
  const debtScore =
    totalLiabilities <= 0
      ? 10
      : clampScore((1 - Math.min(debtToAssets / 0.5, 1)) * 10, 10);

  const scoreComponents: FreedomScoreComponent[] = [
    {
      id: "wealth",
      label: ui("Droga do WOLNOŚCI", "Road to FREE"),
      score: wealthScore,
      maxScore: 30,
      explanation: `${formatMoney(netWorth)} / ${formatMoney(FREEDOM_TARGET)}`,
    },
    {
      id: "savings",
      label: ui("Stopa oszczędności 3M", "Savings rate 3M"),
      score: savingsScore,
      maxScore: 20,
      explanation: ui(`${savingsRate.toFixed(1)}% średnio z ${rollingMonths} mies.`, `${savingsRate.toFixed(1)}% average over ${rollingMonths} mo.`),
    },
    {
      id: "cashflow",
      label: ui("Przepływy 3M", "Cashflow 3M"),
      score: cashflowScore,
      maxScore: 15,
      explanation: ui(`${formatSignedMoney(averageSurplus)} średnio / mies.`, `${formatSignedMoney(averageSurplus)} average / month`),
    },
    {
      id: "investments",
      label: ui("Kapitał inwestycyjny", "Invested capital"),
      score: investmentScore,
      maxScore: 15,
      explanation: ui(`${investmentRatio.toFixed(1)}% aktywów brutto`, `${investmentRatio.toFixed(1)}% of gross assets`),
    },
    {
      id: "safety",
      label: ui("Płynna poduszka", "Liquidity buffer"),
      score: safetyScore,
      maxScore: 10,
      explanation:
        averageExpenses > 0
          ? ui(`${safetyMonths.toFixed(1)} mies. • ${formatMoney(liquidAssets)} płynne`, `${safetyMonths.toFixed(1)} months • ${formatMoney(liquidAssets)} liquid`)
          : ui("Brak wystarczających danych o wydatkach", "Not enough expense data"),
    },
    {
      id: "debt",
      label: ui("Zadłużenie", "Debt"),
      score: debtScore,
      maxScore: 10,
      explanation:
        totalLiabilities > 0
          ? ui(`${formatMoney(totalLiabilities)} • ${(debtToAssets * 100).toFixed(1)}% aktywów`, `${formatMoney(totalLiabilities)} • ${(debtToAssets * 100).toFixed(1)}% of assets`)
          : ui("Brak aktywnych zobowiązań", "No active liabilities"),
    },
  ];

  const freedomScore = Math.round(
    scoreComponents.reduce((sum, item) => sum + item.score, 0)
  );

  const monthsOfHistory = monthlyStats.length;
  const dataConfidence: DataConfidence =
    monthsOfHistory >= 6
      ? "HIGH"
      : monthsOfHistory >= 3
        ? "MEDIUM"
        : "LOW";

  const milestones = MILESTONES.map((milestone) => ({
    ...milestone,
    reached: netWorth >= milestone.value,
  }));

  const nextMilestone =
    milestones.find((milestone) => !milestone.reached) ?? null;

  const amountToNextMilestone = nextMilestone
    ? Math.max(nextMilestone.value - netWorth, 0)
    : 0;

  const monthsToNextMilestone =
    nextMilestone && averageSurplus > 0
      ? Math.ceil(amountToNextMilestone / averageSurplus)
      : null;

  const remainingToFreedom = Math.max(FREEDOM_TARGET - netWorth, 0);
  const monthsToFreedom =
    remainingToFreedom <= 0
      ? 0
      : averageSurplus > 0
        ? Math.ceil(remainingToFreedom / averageSurplus)
        : null;

  const yearsToFreedom =
    monthsToFreedom === null ? null : monthsToFreedom / 12;

  const projectedFreedomDate =
    monthsToFreedom === null ? null : addMonthsToToday(monthsToFreedom, language);

  const progressToFreedom = clamp(
    (netWorth / FREEDOM_TARGET) * 100,
    0,
    100
  );

  const intelligence = buildIntelligence({
    netWorth,
    averageSurplus,
    savingsRate,
    liquidAssets,
    safetyMonths,
    investedAssets,
    totalLiabilities,
    nextMilestone,
    amountToNextMilestone,
    monthsToNextMilestone,
    yearsToFreedom,
    projectedFreedomDate,
    unclassifiedAssets,
    language,
  });

  return {
    freedomTarget: FREEDOM_TARGET,
    freedomScore,
    scoreComponents,
    monthsOfHistory,
    dataConfidence,
    rollingMonths,
    averageIncome,
    averageExpenses,
    averageSurplus,
    savingsRate,
    liquidAssets,
    investedAssets,
    unclassifiedAssets,
    totalLiabilities,
    investmentRatio,
    safetyMonths,
    progressToFreedom,
    nextMilestone,
    amountToNextMilestone,
    monthsToNextMilestone,
    yearsToFreedom,
    projectedFreedomDate,
    milestones,
    intelligence,
  };
}

function buildMonthlyStats(monthlyBudget: MonthlyBudget) {
  const months = new Set<string>();

  monthlyBudget.incomes.forEach((item) => {
    if (item.date) months.add(item.date.slice(0, 7));
  });

  monthlyBudget.expenses.forEach((item) => {
    if (item.date) months.add(item.date.slice(0, 7));
  });

  return [...months]
    .sort()
    .map((month) => {
      const income = monthlyBudget.incomes
        .filter((item) => item.date?.startsWith(month))
        .reduce((sum, item) => sum + item.amount, 0);

      const expenses = monthlyBudget.expenses
        .filter((item) => item.date?.startsWith(month))
        .reduce((sum, item) => sum + item.amount, 0);

      return {
        month,
        income,
        expenses,
        surplus: income - expenses,
      };
    });
}

function buildIntelligence({
  averageSurplus,
  savingsRate,
  liquidAssets,
  safetyMonths,
  investedAssets,
  totalLiabilities,
  nextMilestone,
  amountToNextMilestone,
  monthsToNextMilestone,
  yearsToFreedom,
  projectedFreedomDate,
  unclassifiedAssets,
  language,
}: {
  netWorth: number;
  averageSurplus: number;
  savingsRate: number;
  liquidAssets: number;
  safetyMonths: number;
  investedAssets: number;
  totalLiabilities: number;
  nextMilestone: FreedomMilestone | null;
  amountToNextMilestone: number;
  monthsToNextMilestone: number | null;
  yearsToFreedom: number | null;
  projectedFreedomDate: string | null;
  unclassifiedAssets: number;
  language: AppLanguage;
}): FreedomInsight[] {
  const ui = (pl: string, en: string) => (language === "pl" ? pl : en);
  const insights: FreedomInsight[] = [];

  if (unclassifiedAssets > 0) {
    insights.push({
      type: "mission",
      title: ui("Sklasyfikuj stare aktywa", "Classify legacy assets"),
      text: ui(
        `${formatMoney(unclassifiedAssets)} portfela nadal nie ma kategorii. Edytuj te pozycje w Inwestycjach, aby wyniki płynności i inwestycji były wiarygodne.`,
        `${formatMoney(unclassifiedAssets)} of the portfolio is still unclassified. Edit those positions in Investments so liquidity and investment scores are reliable.`
      ),
    });
  }

  if (averageSurplus > 0 && savingsRate >= 30) {
    insights.push({
      type: "strength",
      title: ui("Największa siła", "Biggest strength"),
      text: ui(
        `Średni przepływ to ${formatSignedMoney(averageSurplus)} miesięcznie przy stopie oszczędności ${savingsRate.toFixed(1)}%.`,
        `Rolling cashflow is ${formatSignedMoney(averageSurplus)} per month with a ${savingsRate.toFixed(1)}% savings rate.`
      ),
    });
  } else if (investedAssets > 0) {
    insights.push({
      type: "strength",
      title: ui("Największa siła", "Biggest strength"),
      text: ui(
        `Masz ${formatMoney(investedAssets)} sklasyfikowanego kapitału inwestycyjnego.`,
        `You have ${formatMoney(investedAssets)} of classified invested capital.`
      ),
    });
  }

  if (nextMilestone) {
    insights.push({
      type: "mission",
      title: ui(`Następna misja: ${nextMilestone.name}`, `Next mission: ${nextMilestone.name}`),
      text:
        monthsToNextMilestone !== null
          ? ui(
              `Brakuje ${formatMoney(amountToNextMilestone)}. Przy obecnym tempie to około ${formatMonths(monthsToNextMilestone)}.`,
              `${formatMoney(amountToNextMilestone)} remains. At the current pace that is about ${formatMonthsEnglish(monthsToNextMilestone)}.`
            )
          : ui(`Brakuje ${formatMoney(amountToNextMilestone)}.`, `${formatMoney(amountToNextMilestone)} remains.`),
    });
  }

  insights.push({
    type: "projection",
    title: ui("Trajektoria WOLNOŚCI", "FREE trajectory"),
    text:
      yearsToFreedom === null
        ? ui("Średni przepływ nie pozwala jeszcze wyznaczyć dodatniej trajektorii.", "Rolling cashflow does not yet support a positive trajectory.")
        : yearsToFreedom <= 0
          ? ui("Cel 3 mln zł został osiągnięty.", "The PLN 3M target has been reached.")
          : ui(
              `Przy utrzymaniu obecnego przepływu prosta trajektoria wskazuje około ${formatYears(yearsToFreedom)}${projectedFreedomDate ? ` — ${projectedFreedomDate}` : ""}.`,
              `At the current rolling cashflow, the simple trajectory points to about ${formatYearsEnglish(yearsToFreedom)}${projectedFreedomDate ? ` — ${projectedFreedomDate}` : ""}.`
            ),
  });

  if (safetyMonths < 6) {
    insights.push({
      type: "opportunity",
      title: ui("Zbuduj poduszkę", "Build the shield"),
      text: ui(
        `Płynna poduszka pokrywa około ${safetyMonths.toFixed(1)} mies. kosztów. Cel silnika to 6 miesięcy.`,
        `The liquidity buffer covers about ${safetyMonths.toFixed(1)} months of expenses. The Engine target is 6 months.`
      ),
    });
  } else if (totalLiabilities > 0) {
    insights.push({
      type: "opportunity",
      title: ui("Presja długu", "Debt pressure"),
      text: ui(
        `Pozostałe zobowiązania: ${formatMoney(totalLiabilities)}. Ich spadek bez utraty aktywów poprawia wynik zadłużenia.`,
        `Remaining liabilities: ${formatMoney(totalLiabilities)}. Reducing them without losing assets improves the debt score.`
      ),
    });
  } else {
    insights.push({
      type: "opportunity",
      title: ui("Efektywność kapitału", "Capital efficiency"),
      text: ui(
        `Płynna poduszka wynosi ${formatMoney(liquidAssets)}. Nadwyżkę ponad własny docelowy bufor możesz świadomie rozdzielać między cele i inwestycje.`,
        `The liquidity buffer is ${formatMoney(liquidAssets)}. Capital above your target buffer can be routed deliberately between goals and investments.`
      ),
    });
  }

  return insights.slice(0, 4);
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clampScore(value: number, max: number) {
  return clamp(value, 0, max);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function addMonthsToToday(months: number, language: AppLanguage) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toLocaleDateString(language === "pl" ? "pl-PL" : "en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString("pl-PL")} zł`;
}

function formatSignedMoney(value: number) {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${Math.round(value).toLocaleString("pl-PL")} zł`;
}

function formatMonths(months: number) {
  if (months < 12) return `${months} mies.`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest > 0 ? `${years} lat ${rest} mies.` : `${years} lat`;
}

function formatYears(years: number) {
  return formatMonths(Math.round(years * 12));
}

function formatMonthsEnglish(months: number) {
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"}`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (rest > 0) return `${years} ${years === 1 ? "year" : "years"} ${rest} ${rest === 1 ? "month" : "months"}`;
  return `${years} ${years === 1 ? "year" : "years"}`;
}

function formatYearsEnglish(years: number) {
  return formatMonthsEnglish(Math.round(years * 12));
}
