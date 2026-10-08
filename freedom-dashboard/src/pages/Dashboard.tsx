import {
  useState,
  type ReactNode,
} from "react";

import { Link } from "react-router-dom";

import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  CheckCircle2,
  Circle,
  CalendarCheck,
  LockKeyhole,
  Gem,
  Gauge,
  Rocket,
  ShieldCheck,
  Minus,
  PiggyBank,
  Target,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import { Header } from "../components/layout/Header";
import { GoalsSection } from "../components/dashboard/GoalsSection";
import { InvestmentSection } from "../components/dashboard/InvestmentSection";
import { PortfolioOverviewSection } from "../components/dashboard/PortfolioOverviewSection";
import { LiabilitiesSection } from "../components/dashboard/LiabilitiesSection";
import { CashflowSection } from "../components/dashboard/CashflowSection";
import { AddExpenseModal } from "../components/dashboard/AddExpenseModal";
import { useLanguage } from "../i18n/LanguageContext";

import {
  calculatePlayerLevel,
  calculateTotalAchievementXp,
  getAchievements,
} from "../features/achievements/achievementEngine";

import { calculateFreedomEngine } from "../features/freedom/freedomEngine";
import { getFreedomMissions } from "../features/missions/missionEngine";
import { routeMoney } from "../features/intelligence/moneyRouter";

import type {
  Expense,
  ExpenseCategory,
  MonthlyBudget,
} from "../types/Cashflow";

import type { Asset } from "../types/Asset";
import type { Goal } from "../types/Goal";
import type { Liability } from "../types/Liability";
import type { NetWorthSnapshot } from "../types/NetWorthHistory";
import type { MonthlySnapshot } from "../types/MonthlySnapshot";

type DashboardProps = {
  netWorth: number;
  portfolio: Asset[];
  goals: Goal[];
  liabilities: Liability[];
  netWorthHistory: NetWorthSnapshot[];
  monthlyBudget: MonthlyBudget;
  monthlySnapshots: MonthlySnapshot[];

  onAddExpense: (
    expense: Expense
  ) => void;
};

type FreedomLevel = {
  level: number;
  name: string;
  min: number;
  target: number | null;
};

type MetricAccent =
  | "blue"
  | "emerald"
  | "red"
  | "amber";

type ComparisonTone =
  | "positive"
  | "negative"
  | "neutral";

const freedomLevels: FreedomLevel[] = [
  {
    level: 1,
    name: "Starter",
    min: 0,
    target: 100_000,
  },
  {
    level: 2,
    name: "Builder",
    min: 100_000,
    target: 250_000,
  },
  {
    level: 3,
    name: "Investor",
    min: 250_000,
    target: 500_000,
  },
  {
    level: 4,
    name: "Accelerator",
    min: 500_000,
    target: 1_000_000,
  },
  {
    level: 5,
    name: "Millionaire",
    min: 1_000_000,
    target: 2_000_000,
  },
  {
    level: 6,
    name: "Independent",
    min: 2_000_000,
    target: 3_000_000,
  },
  {
    level: 7,
    name: "FREE",
    min: 3_000_000,
    target: null,
  },
];

const categoryLabels: Record<
  ExpenseCategory,
  string
> = {
  fixed: "Stałe",
  living: "Życie",
  investment: "Inwestycje",
  goal: "Cele",
};

export function Dashboard({
  netWorth,
  portfolio,
  goals,
  liabilities,
  netWorthHistory,
  monthlyBudget,
  monthlySnapshots,
  onAddExpense,
}: DashboardProps) {
  const { t, language, levelName: translateLevelName } = useLanguage();
  const ui = (pl: string, en: string) => (language === "pl" ? pl : en);

  const [
    isAddExpenseOpen,
    setIsAddExpenseOpen,
  ] = useState(false);

  /*
   * =========================================
   * SELECTED MONTH
   * =========================================
   */

  const [
    selectedMonth,
    setSelectedMonth,
  ] = useState(
    getCurrentMonth()
  );

  const currentMonth =
    getCurrentMonth();

  const isCurrentMonth =
    selectedMonth ===
    currentMonth;

  const selectedMonthLabel =
    formatMonth(
      selectedMonth,
      language
    );

  const previousMonth =
    getMonthWithOffset(
      selectedMonth,
      -1
    );

  const previousMonthLabel =
    formatMonthShort(
      previousMonth,
      language
    );

  function changeMonth(
    offset: number
  ) {
    const nextMonth =
      getMonthWithOffset(
        selectedMonth,
        offset
      );

    if (
      nextMonth >
      currentMonth
    ) {
      return;
    }

    setSelectedMonth(
      nextMonth
    );
  }

  function goToCurrentMonth() {
    setSelectedMonth(
      currentMonth
    );
  }

  /*
   * =========================================
   * SELECTED MONTH TRANSACTIONS
   * =========================================
   */

  const selectedIncomes =
    monthlyBudget.incomes.filter(
      (income) =>
        isTransactionInMonth(
          income.date,
          selectedMonth
        )
    );

  const selectedExpenses =
    monthlyBudget.expenses.filter(
      (expense) =>
        isTransactionInMonth(
          expense.date,
          selectedMonth
        )
    );

  /*
   * =========================================
   * PREVIOUS MONTH TRANSACTIONS
   * =========================================
   */

  const previousIncomes =
    monthlyBudget.incomes.filter(
      (income) =>
        isTransactionInMonth(
          income.date,
          previousMonth
        )
    );

  const previousExpenses =
    monthlyBudget.expenses.filter(
      (expense) =>
        isTransactionInMonth(
          expense.date,
          previousMonth
        )
    );

  const hasPreviousMonthData =
    previousIncomes.length > 0 ||
    previousExpenses.length > 0;

  /*
   * =========================================
   * SELECTED MONTH CASHFLOW
   * =========================================
   */

  const income =
    sumAmounts(
      selectedIncomes
    );

  const expenses =
    sumAmounts(
      selectedExpenses
    );

  const surplus =
    income - expenses;

  const savingsRate =
    calculateSavingsRate(
      income,
      expenses
    );

  /*
   * =========================================
   * PREVIOUS MONTH CASHFLOW
   * =========================================
   */

  const previousIncome =
    sumAmounts(
      previousIncomes
    );

  const previousExpensesTotal =
    sumAmounts(
      previousExpenses
    );

  const previousSurplus =
    previousIncome -
    previousExpensesTotal;

  const previousSavingsRate =
    calculateSavingsRate(
      previousIncome,
      previousExpensesTotal
    );

  /*
   * =========================================
   * MONTH-TO-MONTH COMPARISONS
   * =========================================
   */

  const incomeDifference =
    income -
    previousIncome;

  const expenseDifference =
    expenses -
    previousExpensesTotal;

  const surplusDifference =
    surplus -
    previousSurplus;

  const savingsRateDifference =
    savingsRate -
    previousSavingsRate;

  const incomePercentageChange =
    calculatePercentageChange(
      income,
      previousIncome
    );

  const expensePercentageChange =
    calculatePercentageChange(
      expenses,
      previousExpensesTotal
    );

  /*
   * =========================================
   * NET WORTH
   * =========================================
   */

  const totalAssets =
    portfolio.reduce(
      (sum, asset) =>
        sum + asset.value,
      0
    );

  const totalLiabilities =
    liabilities.reduce(
      (sum, liability) =>
        sum +
        liability.remainingAmount,
      0
    );

  const displayedNetWorth =
    isCurrentMonth
      ? netWorth
      : getNetWorthForMonth(
          netWorthHistory,
          selectedMonth
        );

  const hasHistoricalNetWorth =
    displayedNetWorth !== null;

  const effectiveNetWorth =
    displayedNetWorth ??
    netWorth;

  const netWorthChange =
    calculateNetWorthChangeForMonth(
      netWorthHistory,
      selectedMonth,
      isCurrentMonth
        ? netWorth
        : displayedNetWorth
    );

  /*
   * =========================================
   * FREEDOM LEVEL
   * =========================================
   */

  /*
   * PLAYER LEVEL — XP is the single source of truth.
   * Wealth milestones below remain a separate FREEDOM progression.
   */
  const achievements = getAchievements({
    netWorth,
    portfolio,
    goals,
    liabilities,
    monthlyBudget,
  });

  const totalXp =
    calculateTotalAchievementXp(
      achievements
    );

  const playerLevel =
    calculatePlayerLevel(
      totalXp
    );

  const freedomEngine =
    calculateFreedomEngine({
      netWorth,
      portfolio,
      liabilities,
      monthlyBudget,
    }, language);

  const missions =
    getFreedomMissions({
      netWorth,
      portfolio,
      goals,
      liabilities,
      monthlyBudget,
    }, language);

  const storedFocusedMissionId =
    typeof window !== "undefined"
      ? localStorage.getItem(
          "freedom-focused-mission"
        )
      : null;

  const primaryMission =
    missions.find(
      (mission) =>
        mission.id ===
          storedFocusedMissionId &&
        mission.status !== "COMPLETE"
    ) ??
    missions.find(
      (mission) =>
        mission.status === "ACTIVE"
    ) ??
    null;

  const monthlyRouterAmount = Math.max(Math.round(surplus), 0);

  const moneyPlan = routeMoney({
    amount: monthlyRouterAmount,
    netWorth,
    portfolio,
    goals,
    liabilities,
    monthlyBudget,
  });

  const latestClosedSnapshot = [...monthlySnapshots]
    .sort((a, b) => a.month.localeCompare(b.month))
    .at(-1);

  const previousClosedSnapshot = latestClosedSnapshot
    ? [...monthlySnapshots]
        .filter((snapshot) => snapshot.month < latestClosedSnapshot.month)
        .sort((a, b) => a.month.localeCompare(b.month))
        .at(-1)
    : undefined;

  const latestReviewNetWorthChange =
    latestClosedSnapshot && previousClosedSnapshot
      ? latestClosedSnapshot.wealth.netWorth - previousClosedSnapshot.wealth.netWorth
      : null;

  const latestReviewVerdict = latestClosedSnapshot
    ? getReviewVerdict(
        latestClosedSnapshot.cashflow.savingsRate,
        latestClosedSnapshot.cashflow.surplus,
        latestReviewNetWorthChange
      )
    : null;

  const currentMonthSnapshot = monthlySnapshots.find(
    (snapshot) => snapshot.month === currentMonth
  );

  const hasCurrentMonthTransactions =
    selectedIncomes.length + selectedExpenses.length > 0;

  const hasCurrentMonthIncome =
    selectedIncomes.length > 0;

  /*
   * Backend-authoritative history:
   * NetWorthHistory is written only by Close Month, so it must NOT be
   * a prerequisite for closing the current month.
   */
  const hasCurrentWealthState =
    portfolio.length > 0 ||
    liabilities.length > 0;

  const monthClosed = Boolean(currentMonthSnapshot);

  const monthEnd = getMonthEnd(currentMonth);
  const daysLeftInMonth = Math.max(
    Math.ceil(
      (monthEnd.getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    ),
    0
  );

  const monthlyCycleSteps = [
    {
      label: ui("PLAN", "PLAN"),
      done: true,
      active: false,
    },
    {
      label: ui("ŚLEDŹ", "TRACK"),
      done: hasCurrentMonthTransactions,
      active:
        !monthClosed &&
        hasCurrentMonthTransactions,
    },
    {
      label: ui("PRZEGLĄD", "REVIEW"),
      done:
        hasCurrentMonthIncome &&
        hasCurrentMonthTransactions,
      active:
        !monthClosed &&
        hasCurrentMonthIncome &&
        hasCurrentMonthTransactions,
    },
    {
      label: ui("ZAMKNIJ MIESIĄC", "CLOSE MONTH"),
      done: monthClosed,
      active:
        !monthClosed &&
        hasCurrentMonthIncome &&
        hasCurrentMonthTransactions,
    },
    {
      label: ui("ROZDZIEL ŚRODKI", "ROUTE MONEY"),
      done: monthClosed,
      active: monthClosed,
    },
  ];

  const monthEndChecklist = [
    {
      label: ui("Transakcje zaksięgowane", "Transactions posted"),
      detail: ui(`${selectedIncomes.length + selectedExpenses.length} transakcji w miesiącu`, `${selectedIncomes.length + selectedExpenses.length} transactions this month`),
      done: hasCurrentMonthTransactions,
    },
    {
      label: ui("Dochód zaksięgowany", "Income posted"),
      detail: hasCurrentMonthIncome
        ? formatMoney(income)
        : ui("Brak przychodu w bieżącym miesiącu", "No income in the current month"),
      done: hasCurrentMonthIncome,
    },
    {
      label: ui("Stan majątku gotowy", "Net worth ready"),
      detail: hasCurrentWealthState
        ? ui(`${formatMoney(netWorth)} na żywo · zapis stanu powstanie przy zamknięciu miesiąca`, `${formatMoney(netWorth)} live · snapshot will be created when the month is closed`)
        : ui("Dodaj aktywa lub zobowiązania, aby zbudować stan majątku", "Add assets or liabilities to build your net worth state"),
      done: hasCurrentWealthState,
    },
    {
      label: ui("Przegląd miesiąca zamknięty", "Monthly review closed"),
      detail: monthClosed
        ? ui("Pełny zapis miesiąca jest zamrożony", "The full monthly snapshot is frozen")
        : ui("Przejdź do przeglądu i zamknij miesiąc", "Go to review and close the month"),
      done: monthClosed,
    },
  ];

  const readyToClose =
    hasCurrentMonthTransactions &&
    hasCurrentMonthIncome &&
    !monthClosed;

  const monthScore = calculateMonthScore({
    income,
    surplus,
    savingsRate,
    hasTransactions: hasCurrentMonthTransactions,
    hasWealthState: hasCurrentWealthState,
    monthClosed,
  });

  const monthScoreLabel =
    monthScore >= 85
      ? ui("Świetny miesiąc", "Excellent month")
      : monthScore >= 70
        ? ui("Mocny miesiąc", "Strong month")
        : monthScore >= 50
          ? ui("Budowanie", "Building")
          : ui("Potrzebuje uwagi", "Needs attention");

  const currentLevel =
    findFreedomLevel(
      effectiveNetWorth
    );

  const nextTarget =
    currentLevel.target;

  const amountToNextLevel =
    nextTarget !== null
      ? Math.max(
          nextTarget -
            effectiveNetWorth,
          0
        )
      : 0;

  const levelPercentage =
    calculateFreedomLevelPercentage(
      effectiveNetWorth,
      currentLevel
    );

  /*
   * =========================================
   * EXPENSE CATEGORIES
   * =========================================
   */

  const categoryTotals =
    calculateCategoryTotals(
      selectedExpenses
    );

  const biggestExpenseCategory =
    getBiggestExpenseCategory(
      categoryTotals
    );

  return (
    <main className="min-h-screen bg-[#050b16] p-8 [&_a]:cursor-pointer [&_button:not(:disabled)]:cursor-pointer">
      <Header
        level={playerLevel.level}
        levelName={playerLevel.name}
      />

      {/* =====================================
          PAGE HEADER + MONTH SELECTOR
      ====================================== */}

      <section className="mt-6">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
              {t("financialCommandCenter")}
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
              {selectedMonthLabel}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {isCurrentMonth
                ? t("currentFinancialPicture")
                : t("historicalFinancialPicture")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isCurrentMonth && (
              <button
                type="button"
                onClick={
                  goToCurrentMonth
                }
                className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-400 transition hover:bg-blue-500/20"
              >
                {t("today")}
              </button>
            )}

            <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/70 p-1.5">
              <button
                type="button"
                onClick={() =>
                  changeMonth(-1)
                }
                className="rounded-lg p-2.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                title={t("previousMonth")}
              >
                <ChevronLeft
                  size={19}
                />
              </button>

              <div className="min-w-44 px-4 text-center">
                <p className="text-sm font-semibold capitalize text-white">
                  {selectedMonthLabel}
                </p>

                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  {isCurrentMonth
                    ? t("currentMonth")
                    : t("history")}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  changeMonth(1)
                }
                disabled={
                  isCurrentMonth
                }
                className={`rounded-lg p-2.5 transition ${
                  isCurrentMonth
                    ? "cursor-not-allowed text-slate-700"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
                title={
                  isCurrentMonth
                    ? t("thisIsCurrentMonth")
                    : t("nextMonth")
                }
              >
                <ChevronRight
                  size={19}
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
          HERO — NET WORTH
      ====================================== */}

      <section className="mt-6 overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-slate-900 to-slate-950 p-7 shadow-2xl shadow-blue-950/20">
        <div className="flex flex-col justify-between gap-8 xl:flex-row xl:items-end">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
              <Gem
                size={18}
                className="text-blue-400"
              />

              {isCurrentMonth
                ? ui("Majątek netto", "Net worth")
                : ui("Majątek netto na koniec miesiąca", "Net worth at month end")}
            </div>

            <div className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">
              {hasHistoricalNetWorth ||
              isCurrentMonth
                ? formatMoney(
                    effectiveNetWorth
                  )
                : ui("Brak danych", "No data")}
            </div>

            <div className="mt-3">
              {netWorthChange !==
              null ? (
                <div
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold ${
                    netWorthChange >=
                    0
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {netWorthChange >=
                  0 ? (
                    <ArrowUpRight
                      size={16}
                    />
                  ) : (
                    <ArrowDownRight
                      size={16}
                    />
                  )}

                  {formatSignedMoney(
                    netWorthChange
                  )}

                  <span className="font-normal text-slate-500">
                    w tym miesiącu
                  </span>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Brak wystarczających
                  danych do policzenia
                  zmiany majątku.
                </p>
              )}
            </div>
          </div>

          {isCurrentMonth ? (
            <div className="grid min-w-0 grid-cols-2 gap-3 md:min-w-[420px]">
              <SmallStat
                label={ui("Aktywa", "Assets")}
                value={formatMoney(
                  totalAssets
                )}
                positive
              />

              <SmallStat
                label={ui("Zobowiązania", "Liabilities")}
                value={formatMoney(
                  totalLiabilities
                )}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-5 py-4 text-sm text-slate-500">
              {ui("Aktywa i zobowiązania pokazujemy tylko dla aktualnego stanu.", "Assets and liabilities are shown only for the current state.")}
            </div>
          )}
        </div>
      </section>

      {/* =====================================
          PRIORITY OVERVIEW
      ====================================== */}

      {isCurrentMonth && (
        <>
          <PortfolioOverviewSection assets={portfolio} />

          <div className="mt-5 rounded-3xl border border-slate-800/80 bg-[#07101d]/55 p-1 sm:p-2">
            <GoalsSection goals={goals} />
          </div>

          <LiabilitiesSection liabilities={liabilities} />

          <InvestmentSection
            portfolio={portfolio}
            history={netWorthHistory}
          />
        </>
      )}

      {/* =====================================
          DASHBOARD — COMMAND CENTER
      ====================================== */}

      {isCurrentMonth && (
        <section className="mt-6 overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 via-[#0b1322] to-[#08111f] p-6">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
            <div>
              <div className="flex items-center gap-2">
                <Gauge size={18} className="text-cyan-400" />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">{t("monthlyOperatingSystem")}</p>
              </div>
              <h2 className="mt-2 text-2xl font-black text-white">{ui("Zarabiaj → kontroluj → alokuj → zamknij → rozwijaj majątek", "Earn → control → allocate → close → grow wealth")}</h2>
              <p className="mt-1 text-sm text-slate-500">{ui("Jedna miesięczna pętla sterująca całym FREEDOM.", "One monthly loop controlling all of FREEDOM.")}</p>
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-400">{ui("DO WOLNOŚCI", "TO FREEDOM")}</p>
              <p className="mt-1 text-lg font-black text-white">{formatMoney(Math.max(3_000_000 - netWorth, 0))}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <CommandCard icon={<Gem size={19} />} label={t("netWorth")} value={formatMoney(netWorth)}
              detail={netWorthChange !== null ? ui(`${formatSignedMoney(netWorthChange)} w tym miesiącu`, `${formatSignedMoney(netWorthChange)} this month`) : ui(`${formatMoney(totalAssets)} aktywów · ${formatMoney(totalLiabilities)} długu`, `${formatMoney(totalAssets)} assets · ${formatMoney(totalLiabilities)} debt`)}
              accent="cyan" progress={Math.min((netWorth / 3_000_000) * 100, 100)} />
            <CommandCard icon={<Target size={19} />} label={t("playerLevel")} value={`${ui("POZIOM", "LEVEL")} ${playerLevel.level} · ${translateLevelName(playerLevel.name)}`}
              detail={ui(`${totalXp.toLocaleString("pl-PL")} XP · ${playerLevel.remainingXp.toLocaleString("pl-PL")} XP do następnego`, `${totalXp.toLocaleString("en-US")} XP · ${playerLevel.remainingXp.toLocaleString("en-US")} XP to next level`)}
              accent="violet" progress={playerLevel.progress} />
            <CommandCard icon={<ShieldCheck size={19} />} label={t("primaryMission")}
              value={primaryMission ? primaryMission.title : ui("Brak aktywnej misji", "No active mission")}
              detail={primaryMission ? `${primaryMission.progress.toFixed(0)}% · ${primaryMission.footer}` : ui("Silnik Freedom nie wykrył aktywnego priorytetu.", "Freedom Engine did not detect an active priority.")}
              accent="amber" progress={primaryMission ? primaryMission.progress : 100} />
            <CommandCard icon={<Rocket size={19} />} label={t("currentTrajectory")}
              value={freedomEngine.projectedFreedomDate ? freedomEngine.projectedFreedomDate : freedomEngine.yearsToFreedom !== null ? ui(`${freedomEngine.yearsToFreedom.toFixed(1)} lat`, `${freedomEngine.yearsToFreedom.toFixed(1)} years`) : ui("Brak trajektorii", "No trajectory")}
              detail={ui(`Średni przepływ ${formatSignedMoney(freedomEngine.averageSurplus)} / mies. · Wynik ${freedomEngine.freedomScore}/100`, `Rolling cashflow ${formatSignedMoney(freedomEngine.averageSurplus)} / month · Score ${freedomEngine.freedomScore}/100`)}
              accent="emerald" progress={Math.min((netWorth / 3_000_000) * 100, 100)} />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_1fr]">
            <div className="rounded-2xl border border-slate-800 bg-[#07101d] p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-400">{t("nextMove")}</p>
                  <h3 className="mt-1 text-lg font-black text-white">{ui("Rozdziel nadwyżkę", "Deploy surplus")} · {formatMoney(monthlyRouterAmount)}</h3>
                  <p className="mt-1 text-xs text-slate-600">{ui("Bieżąca nadwyżka tego miesiąca — plan alokacji, jeszcze bez automatycznego wykonania.", "Current monthly surplus — allocation plan, not executed automatically yet.")}</p>
                </div>
                {moneyPlan.deadlineSummary.requiredMonthly > 0 && (
                  <div className={`rounded-xl border px-3 py-2 text-right ${moneyPlan.deadlineSummary.onTrack ? "border-emerald-500/20 bg-emerald-500/10" : "border-rose-500/20 bg-rose-500/10"}`}>
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">{ui("Luka do terminu", "Deadline gap")}</p>
                    <p className={`mt-0.5 font-black ${moneyPlan.deadlineSummary.onTrack ? "text-emerald-400" : "text-rose-400"}`}>
                      {moneyPlan.deadlineSummary.onTrack ? ui("ZGODNIE Z PLANEM", "ON TRACK") : ui(`-${formatMoney(moneyPlan.deadlineSummary.shortfall)} / mies.`, `-${formatMoney(moneyPlan.deadlineSummary.shortfall)} / month`)}
                    </p>
                  </div>
                )}
              </div>

              {moneyPlan.routes.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {moneyPlan.routes.slice(0, 4).map((route, index) => (
                    <div key={`${route.kind}-${route.goalId ?? route.liabilityId ?? index}`} className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-600">#{index + 1}</span>
                          <p className="truncate text-sm font-black text-slate-300">{route.title}</p>
                        </div>
                        {route.fundingStatus === "PARTIAL" && <p className="mt-1 text-[10px] font-black uppercase tracking-[0.1em] text-rose-400">{ui("Niedobór", "Shortfall")}</p>}
                      </div>
                      <p className="shrink-0 font-black text-cyan-400">{formatMoney(route.amount)}</p>
                    </div>
                  ))}
                  {moneyPlan.routes.length > 4 && <p className="pt-1 text-xs text-slate-600">+ {moneyPlan.routes.length - 4} kolejnych pozycji w Freedom Engine</p>}
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-slate-800 p-4 text-sm text-slate-500">{ui("Brak dodatniej nadwyżki do rozdysponowania.", "No positive surplus available to allocate.")}</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#07101d] p-5">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={17} className="text-violet-400" />
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-400">{t("lastReview")}</p>
              </div>
              {latestClosedSnapshot ? (
                <>
                  <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-lg font-black capitalize text-white">{formatMonth(latestClosedSnapshot.month, language)}</p>
                      <p className="mt-1 text-xs text-slate-600">{ui("Zamknięty zapis stanu", "Closed snapshot")} · {latestClosedSnapshot.player.totalXp.toLocaleString(language === "pl" ? "pl-PL" : "en-US")} XP</p>
                    </div>
                    {latestReviewVerdict && <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${latestReviewVerdict.className}`}>{latestReviewVerdict.label}</span>}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <SmallCommandStat label={t("netWorth")} value={formatMoney(latestClosedSnapshot.wealth.netWorth)} />
                    <SmallCommandStat label={ui("Stopa oszczędności", "Savings rate")} value={`${latestClosedSnapshot.cashflow.savingsRate.toFixed(1)}%`} />
                    <SmallCommandStat label={ui("Nadwyżka", "Surplus")} value={formatSignedMoney(latestClosedSnapshot.cashflow.surplus)} />
                    <SmallCommandStat label={ui("Zmiana majątku", "Net worth change")} value={latestReviewNetWorthChange !== null ? formatSignedMoney(latestReviewNetWorthChange) : ui("Pierwszy zapis stanu", "First snapshot")} />
                  </div>
                </>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-slate-800 p-5">
                  <p className="font-black text-slate-300">{ui("Brak zamkniętego miesiąca.", "No closed month yet.")}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{ui("Zamknij miesiąc w przeglądzie, a dashboard zacznie pokazywać ostatni zamrożony wynik.", "Close the month in Review and the dashboard will show the latest frozen result.")}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${Math.min((netWorth / 3_000_000) * 100, 100)}%` }} />
            </div>
            <span className="shrink-0 text-xs font-black text-cyan-400">{Math.min((netWorth / 3_000_000) * 100, 100).toFixed(1)}% {ui("WOLNOŚCI", "FREE")}</span>
          </div>
        </section>
      )}

      {/* =====================================
          MONTHLY CYCLE
      ====================================== */}

      {isCurrentMonth && (
        <section className="mt-6 rounded-3xl border border-slate-800 bg-[#09111f] p-6">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
            <div>
              <div className="flex items-center gap-2 text-blue-400">
                <CalendarCheck size={18} />
                <p className="text-xs font-black uppercase tracking-[0.18em]">
                  {t("monthlyOperatingSystem")}
                </p>
              </div>
              <h2 className="mt-2 text-2xl font-black capitalize text-white">
                {formatMonth(currentMonth, language)}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {ui("Miesięczny system operacyjny: kontrola przepływów pieniężnych, decyzja o nadwyżce i finalny zapis stanu.", "Monthly operating system: cashflow control, surplus decision and final snapshot.")}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="min-w-36 rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                  {t("monthScore")}
                </p>
                <p className="mt-1 text-lg font-black text-violet-300">
                  {monthScore} / 100
                </p>
                <p className="mt-0.5 text-[10px] font-bold text-slate-500">
                  {monthScoreLabel}
                </p>
              </div>

              <div className={`min-w-40 rounded-xl border px-4 py-3 ${
                monthClosed
                  ? "border-emerald-500/20 bg-emerald-500/10"
                  : readyToClose
                    ? "border-cyan-500/20 bg-cyan-500/10"
                    : "border-slate-700 bg-slate-900/60"
              }`}>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                  {t("monthStatus")}
                </p>
                <p className={`mt-1 font-black ${
                  monthClosed
                    ? "text-emerald-400"
                    : readyToClose
                      ? "text-cyan-400"
                      : "text-slate-300"
                }`}>
                  {monthClosed
                    ? ui("ZAMKNIĘTY 🔒", "CLOSED 🔒")
                    : readyToClose
                      ? ui("GOTOWY DO ZAMKNIĘCIA", "READY TO CLOSE")
                      : `${daysLeftInMonth} dni do końca`}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-5">
            {monthlyCycleSteps.map((step, index) => (
              <div
                key={step.label}
                className={`rounded-xl border p-3 ${
                  step.done
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : step.active
                      ? "border-cyan-500/30 bg-cyan-500/10"
                      : "border-slate-800 bg-slate-900/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-black text-slate-600">
                    0{index + 1}
                  </span>
                  {step.done ? (
                    <CheckCircle2 size={15} className="text-emerald-400" />
                  ) : step.active ? (
                    <Circle size={15} className="fill-cyan-400 text-cyan-400" />
                  ) : (
                    <Circle size={15} className="text-slate-700" />
                  )}
                </div>
                <p className={`mt-2 text-[10px] font-black uppercase tracking-[0.1em] ${
                  step.done
                    ? "text-emerald-400"
                    : step.active
                      ? "text-cyan-400"
                      : "text-slate-600"
                }`}>
                  {step.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-slate-800 bg-[#07101d] p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                {ui("Lista końca miesiąca", "Month end checklist")}
              </p>

              <div className="mt-4 space-y-2">
                {monthEndChecklist.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/30 p-3"
                  >
                    {item.done ? (
                      <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-400" />
                    ) : (
                      <Circle size={17} className="mt-0.5 shrink-0 text-slate-700" />
                    )}
                    <div>
                      <p className={`text-sm font-black ${
                        item.done ? "text-slate-200" : "text-slate-500"
                      }`}>
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-600">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-2xl border p-5 ${
              monthClosed
                ? "border-emerald-500/20 bg-emerald-500/5"
                : readyToClose
                  ? "border-cyan-500/20 bg-cyan-500/5"
                  : "border-slate-800 bg-[#07101d]"
            }`}>
              <div className="flex items-center gap-2">
                <LockKeyhole
                  size={17}
                  className={
                    monthClosed
                      ? "text-emerald-400"
                      : readyToClose
                        ? "text-cyan-400"
                        : "text-slate-600"
                  }
                />
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                  {t("nextAction")}
                </p>
              </div>

              <p className="mt-3 text-xl font-black text-white">
                {monthClosed
                  ? ui("Miesiąc zamknięty", "Month closed")
                  : readyToClose
                    ? ui("Czas na przegląd miesiąca", "Time for monthly review")
                    : ui("Uzupełniaj miesiąc", "Keep updating the month")}
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {monthClosed
                  ? ui(`Zapis miesiąca jest zamrożony. Router środków ma ${formatMoney(monthlyRouterAmount)} miesięcznej nadwyżki do rozdysponowania.`, `The snapshot is frozen. Money Router has ${formatMoney(monthlyRouterAmount)} of monthly surplus to allocate.`)
                  : readyToClose
                    ? ui("Podstawowe dane są gotowe. Otwórz przegląd, sprawdź miesiąc i zamknij go.", "The core data is ready. Open Review, check the month and close it.")
                    : ui("Księguj transakcje i aktualizuj majątek netto. FREEDOM sam pokaże, kiedy miesiąc będzie gotowy do zamknięcia.", "Post transactions and update net worth. FREEDOM will show when the month is ready to close.")}
              </p>

              {!monthClosed && readyToClose && (
                <Link
                  to="/review"
                  className="mt-5 inline-flex items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/15 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-cyan-300 transition hover:bg-cyan-500/25"
                >
                  {ui("Otwórz przegląd miesiąca →", "Open monthly review →")}
                </Link>
              )}

              {monthClosed && (
                <Link
                  to="/timeline"
                  className="mt-5 inline-flex items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-emerald-300 transition hover:bg-emerald-500/20"
                >
                  {ui("Zobacz oś finansową →", "View financial timeline →")}
                </Link>
              )}

              {monthClosed && currentMonthSnapshot && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <SmallCommandStat
                    label={ui("Zamknięta nadwyżka", "Closed surplus")}
                    value={formatSignedMoney(currentMonthSnapshot.cashflow.surplus)}
                  />
                  <SmallCommandStat
                    label={ui("Zamknięte oszczędności", "Closed savings")}
                    value={`${currentMonthSnapshot.cashflow.savingsRate.toFixed(1)}%`}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* =====================================
          HISTORICAL WARNING
      ====================================== */}

      {!isCurrentMonth &&
        !hasHistoricalNetWorth && (
          <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-5 py-4">
            <p className="text-sm font-semibold text-amber-300">
              {ui("Brak zapisu majątku netto dla", "No net worth snapshot for")}{" "}
              {selectedMonthLabel}.
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {ui("Przepływy pieniężne poniżej są historyczne, ale do postępu FREEDOM używamy aktualnego majątku, ponieważ nie mamy danych o majątku z tego miesiąca.", "The cashflow below is historical, but FREEDOM progress uses current net worth because there is no net worth data for this month.")}
            </p>
          </div>
        )}

      {/* =====================================
          FREEDOM LEVEL
      ====================================== */}

      <section className="mt-5 rounded-2xl border border-slate-800 bg-[#0b1322] p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {t("wealthMilestone")}
            </p>

            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10">
                <Target className="text-blue-400" />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  {translateLevelName(currentLevel.name)} →{" "}
                  {nextTarget !== null
                    ? formatCompactMoney(nextTarget)
                    : ui("WOLNOŚĆ", "FREE")}
                </h2>

                {nextTarget !==
                null ? (
                  <p className="mt-1 text-sm text-slate-500">
                    {ui("Jeszcze", "Remaining")}{" "}
                    <span className="font-semibold text-white">
                      {formatMoney(
                        amountToNextLevel
                      )}
                    </span>{" "}
                    {ui("do następnego poziomu.", "to the next level.")}
                  </p>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-emerald-400">
                    {ui("Osiągnięty poziom WOLNOŚĆ.", "FREE level reached.")}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="text-left md:text-right">
            <div className="text-2xl font-black text-blue-400">
              {levelPercentage.toFixed(
                1
              )}
              %
            </div>

            <div className="text-xs text-slate-500">
              {ui("postęp poziomu", "level progress")}
            </div>
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{
              width: `${Math.min(
                levelPercentage,
                100
              )}%`,
            }}
          />
        </div>

        <div className="mt-3 flex justify-between text-xs text-slate-600">
          <span>
            {formatCompactMoney(
              currentLevel.min
            )}
          </span>

          <span>
            {nextTarget !== null
              ? formatCompactMoney(
                  nextTarget
                )
              : ui("WOLNOŚĆ", "FREE")}
          </span>
        </div>
      </section>

      {/* =====================================
          MONTHLY CASHFLOW + COMPARISON
      ====================================== */}

      <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric
          title={ui("Przychody", "Income")}
          value={formatMoney(
            income
          )}
          subtitle={`${selectedIncomes.length} transakcji`}
          icon={
            <CircleDollarSign
              size={21}
            />
          }
          accent="emerald"
          comparison={
            hasPreviousMonthData
              ? {
                  text:
                    formatMoneyComparison(
                      incomeDifference,
                      incomePercentageChange,
                      previousMonthLabel
                    ),

                  tone:
                    getStandardComparisonTone(
                      incomeDifference
                    ),

                  direction:
                    getDirection(
                      incomeDifference
                    ),
                }
              : undefined
          }
        />

        <DashboardMetric
          title={ui("Wydatki", "Expenses")}
          value={formatMoney(
            expenses
          )}
          subtitle={`${selectedExpenses.length} transakcji`}
          icon={
            <WalletCards
              size={21}
            />
          }
          accent="red"
          comparison={
            hasPreviousMonthData
              ? {
                  text:
                    formatMoneyComparison(
                      expenseDifference,
                      expensePercentageChange,
                      previousMonthLabel
                    ),

                  /*
                   * Przy wydatkach:
                   * mniej = lepiej.
                   */
                  tone:
                    getExpenseComparisonTone(
                      expenseDifference
                    ),

                  direction:
                    getDirection(
                      expenseDifference
                    ),
                }
              : undefined
          }
        />

        <DashboardMetric
          title={ui("Nadwyżka", "Surplus")}
          value={formatSignedMoney(
            surplus
          )}
          subtitle={
            surplus >= 0
              ? ui("Zostaje po wydatkach", "Left after expenses")
              : ui("Wydatki przekroczyły wpływy", "Expenses exceeded income")
          }
          icon={
            <PiggyBank
              size={21}
            />
          }
          accent={
            surplus >= 0
              ? "blue"
              : "red"
          }
          comparison={
            hasPreviousMonthData
              ? {
                  text:
                    `${formatSignedMoney(
                      surplusDifference
                    )} vs ${previousMonthLabel}`,

                  tone:
                    getStandardComparisonTone(
                      surplusDifference
                    ),

                  direction:
                    getDirection(
                      surplusDifference
                    ),
                }
              : undefined
          }
        />

        <DashboardMetric
          title={ui("Stopa oszczędności", "Savings rate")}
          value={`${savingsRate.toFixed(
            1
          )}%`}
          subtitle={
            income === 0
              ? ui("Brak przychodów", "No income")
              : savingsRate >= 50
                ? ui("Powyżej celu 50%", "Above the 50% target")
                : ui("Cel: minimum 50%", "Target: minimum 50%")
          }
          icon={
            <TrendingUp
              size={21}
            />
          }
          accent={
            savingsRate >= 50
              ? "emerald"
              : savingsRate >=
                  20
                ? "amber"
                : "red"
          }
          comparison={
            hasPreviousMonthData
              ? {
                  text:
                    `${formatSignedNumber(
                      savingsRateDifference,
                      1
                    )} pp vs ${previousMonthLabel}`,

                  tone:
                    getStandardComparisonTone(
                      savingsRateDifference
                    ),

                  direction:
                    getDirection(
                      savingsRateDifference
                    ),
                }
              : undefined
          }
        />
      </section>

      {/* =====================================
          MONTH COMPARISON SUMMARY
      ====================================== */}

      <section className="mt-5 rounded-2xl border border-slate-800 bg-[#0b1322] p-6">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {t("monthOverMonth")}
            </p>

            <h2 className="mt-2 text-lg font-bold">
              {selectedMonthLabel} {ui("a", "vs")}{" "}
              {formatMonth(
                previousMonth,
                language
              )}
            </h2>
          </div>

          {hasPreviousMonthData && (
            <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-500">
              {ui("Porównanie do poprzedniego miesiąca", "Comparison with the previous month")}
            </div>
          )}
        </div>

        {hasPreviousMonthData ? (
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <ComparisonBox
              label={ui("Przychody", "Income")}
              current={income}
              previous={
                previousIncome
              }
              difference={
                incomeDifference
              }
              positiveWhenHigher
            />

            <ComparisonBox
              label={ui("Wydatki", "Expenses")}
              current={expenses}
              previous={
                previousExpensesTotal
              }
              difference={
                expenseDifference
              }
              positiveWhenHigher={
                false
              }
            />

            <ComparisonBox
              label={ui("Nadwyżka", "Surplus")}
              current={surplus}
              previous={
                previousSurplus
              }
              difference={
                surplusDifference
              }
              positiveWhenHigher
            />

            <SavingsComparisonBox
              current={
                savingsRate
              }
              previous={
                previousSavingsRate
              }
            />
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-7 text-center">
            <p className="font-medium text-slate-300">
              {ui("Brak danych z", "No data for")}{" "}
              {formatMonth(
                previousMonth,
                language
              )}.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {ui("Gdy pojawią się transakcje z poprzedniego miesiąca, zobaczysz tutaj pełne porównanie.", "When transactions from the previous month appear, you will see the full comparison here.")}
            </p>
          </div>
        )}
      </section>

      {/* =====================================
          MONTH SNAPSHOT
      ====================================== */}

      <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-[#0b1322] p-6 xl:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {ui("Miesiąc w skrócie", "Month at a glance")}
          </p>

          <h2 className="mt-2 text-lg font-bold">
            {ui("Gdzie poszły pieniądze?", "Where did the money go?")}
          </h2>

          {expenses > 0 ? (
            <div className="mt-6 space-y-5">
              {(
                Object.keys(
                  categoryTotals
                ) as ExpenseCategory[]
              ).map(
                (category) => {
                  const value =
                    categoryTotals[
                      category
                    ];

                  const percentage =
                    expenses > 0
                      ? (value /
                          expenses) *
                        100
                      : 0;

                  return (
                    <CategoryBar
                      key={
                        category
                      }
                      label={
                        categoryLabels[
                          category
                        ]
                      }
                      value={value}
                      percentage={
                        percentage
                      }
                    />
                  );
                }
              )}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center">
              <p className="font-medium text-slate-300">
                {ui("Brak wydatków w", "No expenses in")}{" "}
                {selectedMonthLabel}.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {ui("W tym miesiącu nie ma zaksięgowanych wydatków.", "There are no posted expenses this month.")}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0b1322] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {t("quickInsight")}
          </p>

          <h2 className="mt-2 text-lg font-bold">
            {ui("Kondycja miesiąca", "Month condition")}
          </h2>

          <div className="mt-6 space-y-4">
            <InsightRow
              label={ui("Wpływy", "Income")}
              value={formatMoney(
                income
              )}
            />

            <InsightRow
              label={ui("Wydatki", "Expenses")}
              value={formatMoney(
                expenses
              )}
            />

            <InsightRow
              label={ui("Bilans", "Balance")}
              value={formatSignedMoney(
                surplus
              )}
              valueClassName={
                surplus >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }
            />

            <InsightRow
              label={ui("Największa kategoria", "Largest category")}
              value={
                biggestExpenseCategory
                  ? categoryLabels[
                      biggestExpenseCategory
                        .category
                    ]
                  : "—"
              }
            />
          </div>

          <div
            className={`mt-6 rounded-xl border p-4 ${
              savingsRate >= 50
                ? "border-emerald-500/20 bg-emerald-500/10"
                : savingsRate >= 20
                  ? "border-amber-500/20 bg-amber-500/10"
                  : "border-red-500/20 bg-red-500/10"
            }`}
          >
            <p className="text-sm font-semibold">
              {getSavingsMessage(
                income,
                savingsRate,
                surplus
              )}
            </p>
          </div>
        </div>
      </section>

      {/* =====================================
          FREEDOM ROAD
      ====================================== */}

      <section className="mt-5 rounded-2xl border border-slate-800 bg-[#0b1322] p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {t("freedomRoad")}
          </p>

          <h2 className="mt-2 text-lg font-bold">
            {ui("Droga do 3 000 000 zł", "Road to PLN 3,000,000")}
          </h2>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
          {freedomLevels.map(
            (level) => {
              const completed =
                effectiveNetWorth >=
                (level.target ??
                  level.min);

              const active =
                level.level ===
                currentLevel.level;

              return (
                <div
                  key={
                    level.level
                  }
                  className={`rounded-xl border p-4 transition ${
                    active
                      ? "border-blue-500/40 bg-blue-500/10"
                      : completed
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-slate-800 bg-slate-950/40"
                  }`}
                >
                  <div
                    className={`text-xs font-bold ${
                      active
                        ? "text-blue-400"
                        : completed
                          ? "text-emerald-400"
                          : "text-slate-600"
                    }`}
                  >
                    {ui("POZIOM", "LEVEL")}{" "}
                    {level.level}
                  </div>

                  <div className="mt-2 font-semibold">
                    {translateLevelName(level.name)}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {level.level ===
                    1
                      ? "< 100k"
                      : formatCompactMoney(
                          level.min
                        )}
                  </div>

                  {active && (
                    <div className="mt-3 text-xs font-bold text-blue-400">
                      ← {ui("TY", "YOU")}
                    </div>
                  )}

                  {!active &&
                    completed && (
                      <div className="mt-3 text-xs font-bold text-emerald-400">
                        ✓ {ui("GOTOWE", "DONE")}
                      </div>
                    )}
                </div>
              );
            }
          )}
        </div>
      </section>

      {/* =====================================
          EXISTING MODULES
      ====================================== */}

      <CashflowSection
        budget={{
          incomes:
            selectedIncomes,

          expenses:
            selectedExpenses,
        }}
        onAddExpenseClick={() =>
          setIsAddExpenseOpen(
            true
          )
        }
      />

      {isAddExpenseOpen && (
        <AddExpenseModal
          assets={portfolio}
          onClose={() =>
            setIsAddExpenseOpen(
              false
            )
          }
          onAdd={
            onAddExpense
          }
        />
      )}
    </main>
  );
}

/*
 * =========================================
 * COMPONENTS
 * =========================================
 */

type MetricComparison = {
  text: string;
  tone: ComparisonTone;

  direction:
    | "up"
    | "down"
    | "same";
};

type DashboardMetricProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  accent: MetricAccent;

  comparison?: MetricComparison;
};

type CommandAccent =
  | "violet"
  | "cyan"
  | "emerald"
  | "amber";

function CommandCard({
  icon,
  label,
  value,
  detail,
  accent,
  progress,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  accent: CommandAccent;
  progress: number;
}) {
  const styles = {
    violet: {
      icon: "bg-violet-500/10 text-violet-400",
      bar: "bg-violet-500",
    },
    cyan: {
      icon: "bg-cyan-500/10 text-cyan-400",
      bar: "bg-cyan-400",
    },
    emerald: {
      icon: "bg-emerald-500/10 text-emerald-400",
      bar: "bg-emerald-400",
    },
    amber: {
      icon: "bg-amber-500/10 text-amber-400",
      bar: "bg-amber-400",
    },
  }[accent];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/35 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
            {label}
          </p>
          <p className="mt-2 text-lg font-black text-white">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-2 min-h-8 text-xs leading-4 text-slate-500">
        {detail}
      </p>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${styles.bar}`}
          style={{
            width: `${Math.max(
              0,
              Math.min(progress, 100)
            )}%`,
          }}
        />
      </div>
    </div>
  );
}

function getMonthEnd(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber, 0, 23, 59, 59, 999);
}

function SmallCommandStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-600">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-200">{value}</p>
    </div>
  );
}

function getReviewVerdict(savingsRate: number, surplus: number, netWorthChange: number | null) {
  if (surplus < 0 || savingsRate < 0) return { label: "Recovery", className: "border-rose-500/20 bg-rose-500/10 text-rose-400" };
  if (savingsRate >= 50 && (netWorthChange === null || netWorthChange >= 0)) return { label: "Strong Month", className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" };
  if (savingsRate >= 25) return { label: "Solid Month", className: "border-blue-500/20 bg-blue-500/10 text-blue-400" };
  return { label: "Building", className: "border-amber-500/20 bg-amber-500/10 text-amber-400" };
}

function DashboardMetric({
  title,
  value,
  subtitle,
  icon,
  accent,
  comparison,
}: DashboardMetricProps) {
  const accentClasses = {
    blue: {
      icon: "bg-blue-500/10 text-blue-400",
      border:
        "hover:border-blue-500/30",
    },

    emerald: {
      icon: "bg-emerald-500/10 text-emerald-400",
      border:
        "hover:border-emerald-500/30",
    },

    red: {
      icon: "bg-red-500/10 text-red-400",
      border:
        "hover:border-red-500/30",
    },

    amber: {
      icon: "bg-amber-500/10 text-amber-400",
      border:
        "hover:border-amber-500/30",
    },
  };

  const classes =
    accentClasses[accent];

  return (
    <div
      className={`
        rounded-2xl
        border border-slate-800
        bg-[#0b1322]
        p-5
        transition
        ${classes.border}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-black tracking-tight">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${classes.icon}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {subtitle}
      </p>

      {comparison && (
        <ComparisonBadge
          comparison={
            comparison
          }
        />
      )}
    </div>
  );
}

function ComparisonBadge({
  comparison,
}: {
  comparison: MetricComparison;
}) {
  const toneClasses = {
    positive:
      "bg-emerald-500/10 text-emerald-400",

    negative:
      "bg-red-500/10 text-red-400",

    neutral:
      "bg-slate-800 text-slate-400",
  };

  return (
    <div
      className={`mt-4 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${toneClasses[comparison.tone]}`}
    >
      {comparison.direction ===
        "up" && (
        <ArrowUpRight
          size={14}
        />
      )}

      {comparison.direction ===
        "down" && (
        <ArrowDownRight
          size={14}
        />
      )}

      {comparison.direction ===
        "same" && (
        <Minus size={14} />
      )}

      {comparison.text}
    </div>
  );
}

type ComparisonBoxProps = {
  label: string;
  current: number;
  previous: number;
  difference: number;
  positiveWhenHigher: boolean;
};

function ComparisonBox({
  label,
  current,
  previous,
  difference,
  positiveWhenHigher,
}: ComparisonBoxProps) {
  const isPositive =
    difference === 0
      ? null
      : positiveWhenHigher
        ? difference > 0
        : difference < 0;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-slate-600">
            Teraz
          </p>

          <p className="mt-1 font-bold">
            {formatMoney(
              current
            )}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-600">
            Poprzednio
          </p>

          <p className="mt-1 text-sm text-slate-400">
            {formatMoney(
              previous
            )}
          </p>
        </div>
      </div>

      <div
        className={`mt-4 flex items-center gap-1.5 text-xs font-bold ${
          isPositive === true
            ? "text-emerald-400"
            : isPositive ===
                false
              ? "text-red-400"
              : "text-slate-500"
        }`}
      >
        {difference > 0 ? (
          <ArrowUpRight
            size={14}
          />
        ) : difference < 0 ? (
          <ArrowDownRight
            size={14}
          />
        ) : (
          <Minus size={14} />
        )}

        {formatSignedMoney(
          difference
        )}
      </div>
    </div>
  );
}

function SavingsComparisonBox({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  const difference =
    current - previous;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
        Savings rate
      </p>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-slate-600">
            Teraz
          </p>

          <p className="mt-1 font-bold">
            {current.toFixed(
              1
            )}
            %
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-600">
            Poprzednio
          </p>

          <p className="mt-1 text-sm text-slate-400">
            {previous.toFixed(
              1
            )}
            %
          </p>
        </div>
      </div>

      <div
        className={`mt-4 flex items-center gap-1.5 text-xs font-bold ${
          difference > 0
            ? "text-emerald-400"
            : difference < 0
              ? "text-red-400"
              : "text-slate-500"
        }`}
      >
        {difference > 0 ? (
          <ArrowUpRight
            size={14}
          />
        ) : difference < 0 ? (
          <ArrowDownRight
            size={14}
          />
        ) : (
          <Minus size={14} />
        )}

        {formatSignedNumber(
          difference,
          1
        )}{" "}
        pp
      </div>
    </div>
  );
}

type SmallStatProps = {
  label: string;
  value: string;
  positive?: boolean;
};

function SmallStat({
  label,
  value,
  positive = false,
}: SmallStatProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 font-bold ${
          positive
            ? "text-emerald-400"
            : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

type CategoryBarProps = {
  label: string;
  value: number;
  percentage: number;
};

function CategoryBar({
  label,
  value,
  percentage,
}: CategoryBarProps) {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-300">
            {label}
          </p>

          <p className="mt-1 text-xs text-slate-600">
            {percentage.toFixed(
              1
            )}
            % wydatków
          </p>
        </div>

        <p className="text-sm font-bold">
          {formatMoney(value)}
        </p>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-blue-500"
          style={{
            width: `${Math.min(
              percentage,
              100
            )}%`,
          }}
        />
      </div>
    </div>
  );
}

type InsightRowProps = {
  label: string;
  value: string;
  valueClassName?: string;
};

function InsightRow({
  label,
  value,
  valueClassName = "text-white",
}: InsightRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3 last:border-0">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span
        className={`text-sm font-bold ${valueClassName}`}
      >
        {value}
      </span>
    </div>
  );
}

/*
 * =========================================
 * HELPERS
 * =========================================
 */

function getCurrentMonth() {
  const now =
    new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
}

function getMonthWithOffset(
  month: string,
  offset: number
) {
  const [
    year,
    monthNumber,
  ] =
    month
      .split("-")
      .map(Number);

  const date =
    new Date(
      year,
      monthNumber -
        1 +
        offset,
      1
    );

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function isTransactionInMonth(
  date: string | undefined,
  month: string
) {
  if (!date) {
    return false;
  }

  return date.startsWith(
    month
  );
}

function sumAmounts<
  T extends {
    amount: number;
  },
>(
  items: T[]
) {
  return items.reduce(
    (sum, item) =>
      sum + item.amount,
    0
  );
}

function calculateSavingsRate(
  income: number,
  expenses: number
) {
  if (income <= 0) {
    return 0;
  }

  return (
    ((income - expenses) /
      income) *
    100
  );
}

function calculatePercentageChange(
  current: number,
  previous: number
) {
  /*
   * Nie da się sensownie policzyć
   * procentowej zmiany od zera.
   */
  if (previous === 0) {
    return null;
  }

  return (
    ((current - previous) /
      Math.abs(previous)) *
    100
  );
}

function getDirection(
  difference: number
):
  | "up"
  | "down"
  | "same" {
  if (difference > 0) {
    return "up";
  }

  if (difference < 0) {
    return "down";
  }

  return "same";
}

function getStandardComparisonTone(
  difference: number
): ComparisonTone {
  if (difference > 0) {
    return "positive";
  }

  if (difference < 0) {
    return "negative";
  }

  return "neutral";
}

function getExpenseComparisonTone(
  difference: number
): ComparisonTone {
  if (difference < 0) {
    return "positive";
  }

  if (difference > 0) {
    return "negative";
  }

  return "neutral";
}

function formatMonth(
  month: string,
  language: "pl" | "en"
) {
  const [
    year,
    monthNumber,
  ] =
    month
      .split("-")
      .map(Number);

  const date =
    new Date(
      year,
      monthNumber - 1,
      1
    );

  const formatted =
    new Intl.DateTimeFormat(
      language === "pl" ? "pl-PL" : "en-US",
      {
        month: "long",
        year: "numeric",
      }
    ).format(date);

  return (
    formatted
      .charAt(0)
      .toUpperCase() +
    formatted.slice(1)
  );
}

function formatMonthShort(
  month: string,
  language: "pl" | "en"
) {
  const [
    year,
    monthNumber,
  ] =
    month
      .split("-")
      .map(Number);

  const date =
    new Date(
      year,
      monthNumber - 1,
      1
    );

  return new Intl.DateTimeFormat(
    language === "pl" ? "pl-PL" : "en-US",
    {
      month: "short",
    }
  )
    .format(date)
    .replace(".", "");
}

function formatMoney(
  value: number
) {
  return `${Math.round(
    value
  ).toLocaleString(
    "pl-PL"
  )} zł`;
}

function formatSignedMoney(
  value: number
) {
  if (value > 0) {
    return `+${formatMoney(
      value
    )}`;
  }

  return formatMoney(value);
}

function formatSignedNumber(
  value: number,
  decimals: number
) {
  const formatted =
    Math.abs(value).toFixed(
      decimals
    );

  if (value > 0) {
    return `+${formatted}`;
  }

  if (value < 0) {
    return `-${formatted}`;
  }

  return Number(0).toFixed(
    decimals
  );
}

function formatMoneyComparison(
  difference: number,
  percentageChange:
    | number
    | null,
  previousMonthLabel: string
) {
  const money =
    formatSignedMoney(
      difference
    );

  if (
    percentageChange === null
  ) {
    return `${money} vs ${previousMonthLabel}`;
  }

  return `${money} · ${formatSignedNumber(
    percentageChange,
    1
  )}% vs ${previousMonthLabel}`;
}

function formatCompactMoney(
  value: number
) {
  if (value >= 1_000_000) {
    const millions =
      value / 1_000_000;

    return `${millions.toLocaleString(
      "pl-PL",
      {
        maximumFractionDigits:
          1,
      }
    )} mln`;
  }

  if (value >= 1000) {
    return `${Math.round(
      value / 1000
    )}k`;
  }

  return value.toLocaleString(
    "pl-PL"
  );
}

function findFreedomLevel(
  netWorth: number
): FreedomLevel {
  for (
    let index =
      freedomLevels.length - 1;
    index >= 0;
    index--
  ) {
    if (
      netWorth >=
      freedomLevels[index].min
    ) {
      return freedomLevels[
        index
      ];
    }
  }

  return freedomLevels[0];
}

function calculateFreedomLevelPercentage(
  netWorth: number,
  level: FreedomLevel
) {
  if (
    level.target === null
  ) {
    return 100;
  }

  const range =
    level.target -
    level.min;

  const progress =
    netWorth -
    level.min;

  if (range <= 0) {
    return 100;
  }

  return Math.max(
    0,
    Math.min(
      (progress / range) *
        100,
      100
    )
  );
}

function calculateCategoryTotals(
  expenses: Expense[]
): Record<
  ExpenseCategory,
  number
> {
  const result: Record<
    ExpenseCategory,
    number
  > = {
    fixed: 0,
    living: 0,
    investment: 0,
    goal: 0,
  };

  expenses.forEach(
    (expense) => {
      result[
        expense.category
      ] += expense.amount;
    }
  );

  return result;
}

function getBiggestExpenseCategory(
  totals: Record<
    ExpenseCategory,
    number
  >
) {
  const entries =
    Object.entries(
      totals
    ) as [
      ExpenseCategory,
      number,
    ][];

  const sorted =
    [...entries].sort(
      (a, b) =>
        b[1] - a[1]
    );

  const biggest =
    sorted[0];

  if (
    !biggest ||
    biggest[1] <= 0
  ) {
    return null;
  }

  return {
    category:
      biggest[0],

    amount:
      biggest[1],
  };
}

function getNetWorthForMonth(
  history: NetWorthSnapshot[],
  month: string
) {
  const snapshots =
    history
      .filter(
        (snapshot) =>
          snapshot.date?.startsWith(
            month
          )
      )
      .sort((a, b) =>
        a.date.localeCompare(
          b.date
        )
      );

  if (
    snapshots.length === 0
  ) {
    return null;
  }

  return snapshots[
    snapshots.length - 1
  ].value;
}

function calculateNetWorthChangeForMonth(
  history: NetWorthSnapshot[],
  month: string,
  endValue: number | null
) {
  if (
    endValue === null
  ) {
    return null;
  }

  const snapshots =
    history
      .filter(
        (snapshot) =>
          snapshot.date?.startsWith(
            month
          )
      )
      .sort((a, b) =>
        a.date.localeCompare(
          b.date
        )
      );

  if (
    snapshots.length === 0
  ) {
    return null;
  }

  const firstSnapshot =
    snapshots[0];

  return (
    endValue -
    firstSnapshot.value
  );
}


function calculateMonthScore({
  income,
  surplus,
  savingsRate,
  hasTransactions,
  hasWealthState,
  monthClosed,
}: {
  income: number;
  surplus: number;
  savingsRate: number;
  hasTransactions: boolean;
  hasWealthState: boolean;
  monthClosed: boolean;
}) {
  let score = 0;

  if (hasTransactions) score += 15;
  if (income > 0) score += 15;
  if (hasWealthState) score += 10;

  if (surplus > 0) {
    score += 20;
  } else if (surplus === 0 && income > 0) {
    score += 8;
  }

  if (savingsRate >= 50) {
    score += 30;
  } else if (savingsRate >= 30) {
    score += 22;
  } else if (savingsRate >= 10) {
    score += 12;
  } else if (savingsRate > 0) {
    score += 5;
  }

  if (monthClosed) score += 10;

  return Math.max(0, Math.min(score, 100));
}

function getSavingsMessage(
  income: number,
  savingsRate: number,
  surplus: number
) {
  if (income === 0) {
    return "Brak zaksięgowanych przychodów w tym miesiącu.";
  }

  if (surplus < 0) {
    return "Miesiąc jest obecnie pod kreską.";
  }

  if (savingsRate >= 50) {
    return "🔥 Ponad połowa dochodu zostaje po wydatkach.";
  }

  if (savingsRate >= 30) {
    return "Solidna nadwyżka. Jesteś powyżej 30% oszczędności.";
  }

  if (savingsRate >= 10) {
    return "Miesiąc jest na plusie, ale jest przestrzeń na większą nadwyżkę.";
  }

  return "Nadwyżka jest niewielka względem przychodów.";
}