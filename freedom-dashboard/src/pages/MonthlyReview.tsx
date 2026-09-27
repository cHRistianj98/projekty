import { useMemo, useState } from "react";

import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CircleDollarSign,
  Gauge,
  Landmark,
  Sparkles,
  Target,
  Trophy,
  WalletCards,
} from "lucide-react";

import {
  calculatePlayerLevel,
  calculateTotalAchievementXp,
  getAchievements,
} from "../features/achievements/achievementEngine";

import type { Asset } from "../types/Asset";
import type { Goal } from "../types/Goal";
import type { Liability } from "../types/Liability";
import type { MonthlyBudget } from "../types/Cashflow";
import type { NetWorthSnapshot } from "../types/NetWorthHistory";

type MonthlyReviewProps = {
  netWorth: number;
  portfolio: Asset[];
  goals: Goal[];
  liabilities: Liability[];
  monthlyBudget: MonthlyBudget;
  netWorthHistory: NetWorthSnapshot[];
};

export function MonthlyReview({
  netWorth,
  portfolio,
  goals,
  liabilities,
  monthlyBudget,
  netWorthHistory,
}: MonthlyReviewProps) {
  const availableMonths = useMemo(
    () => getAvailableMonths(monthlyBudget, netWorthHistory),
    [monthlyBudget, netWorthHistory]
  );

  const [selectedMonth, setSelectedMonth] = useState(() =>
    getLatestMonth(monthlyBudget)
  );

  const reviewMonth = availableMonths.includes(selectedMonth)
    ? selectedMonth
    : availableMonths.at(-1) ?? getLatestMonth(monthlyBudget);

  const monthLabel = formatMonth(reviewMonth);
  const selectedMonthIndex = availableMonths.indexOf(reviewMonth);
  const isLatestMonth =
    selectedMonthIndex === availableMonths.length - 1;

  function moveMonth(direction: -1 | 1) {
    const nextIndex = selectedMonthIndex + direction;

    if (nextIndex < 0 || nextIndex >= availableMonths.length) {
      return;
    }

    setSelectedMonth(availableMonths[nextIndex]);
  }

  const incomes = monthlyBudget.incomes.filter(
    (income) => income.date.slice(0, 7) === reviewMonth
  );

  const expenses = monthlyBudget.expenses.filter(
    (expense) => expense.date.slice(0, 7) === reviewMonth
  );

  const income = sum(incomes.map((item) => item.amount));
  const expense = sum(expenses.map((item) => item.amount));
  const surplus = income - expense;
  const savingsRate = income > 0 ? (surplus / income) * 100 : 0;

  const sortedHistory = [...netWorthHistory].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const currentMonthSnapshots = sortedHistory.filter(
    (snapshot) => snapshot.date.slice(0, 7) === reviewMonth
  );

  const currentSnapshot = currentMonthSnapshots.at(-1);

  const previousMonth =
    selectedMonthIndex > 0
      ? availableMonths[selectedMonthIndex - 1]
      : null;

  const previousSnapshot = previousMonth
    ? [...sortedHistory]
        .reverse()
        .find(
          (snapshot) =>
            snapshot.date.slice(0, 7) === previousMonth
        )
    : undefined;

  const reviewedNetWorth = currentSnapshot?.value ?? null;
  const netWorthChange =
    reviewedNetWorth !== null && previousSnapshot
      ? reviewedNetWorth - previousSnapshot.value
      : null;

  const achievements = getAchievements({
    netWorth,
    portfolio,
    goals,
    liabilities,
    monthlyBudget,
  });

  const unlockedAchievements = achievements.filter(
    (achievement) => achievement.unlocked
  );

  const totalXp = calculateTotalAchievementXp(achievements);
  const playerLevel = calculatePlayerLevel(totalXp);

  const monthlyPrincipal = sum(
    liabilities.map((liability) =>
      Math.max(liability.principalPayment ?? 0, 0)
    )
  );

  const monthlyInterest = sum(
    liabilities.map((liability) =>
      Math.max(liability.interestPayment ?? 0, 0)
    )
  );

  const totalDebt = sum(
    liabilities.map((liability) =>
      Math.max(liability.remainingAmount, 0)
    )
  );

  const activeGoals = goals
    .filter((goal) => goal.targetAmount > goal.currentAmount)
    .map((goal) => ({
      ...goal,
      progress:
        goal.targetAmount > 0
          ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
          : 0,
      remaining: Math.max(goal.targetAmount - goal.currentAmount, 0),
    }))
    .sort((a, b) => b.progress - a.progress);

  const verdict = getVerdict(savingsRate, surplus, netWorthChange);
  const strongestPoint = getStrongestPoint({
    savingsRate,
    surplus,
    netWorthChange,
  });
  const nextMove = getNextMove({
    savingsRate,
    liabilities,
    goals: activeGoals,
  });

  return (
    <main className="min-h-screen bg-[#050b16] px-8 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-5 border-b border-slate-800 pb-7 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-400">
              <CalendarDays size={16} />
              Monthly Review 1.0
            </div>

            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => moveMonth(-1)}
                disabled={selectedMonthIndex <= 0}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-25"
                aria-label="Poprzedni miesiąc"
              >
                <ChevronLeft size={19} />
              </button>

              <h1 className="min-w-[260px] text-center text-4xl font-black tracking-tight capitalize">
                {monthLabel}
              </h1>

              <button
                type="button"
                onClick={() => moveMonth(1)}
                disabled={selectedMonthIndex >= availableMonths.length - 1}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-25"
                aria-label="Następny miesiąc"
              >
                <ChevronRight size={19} />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {availableMonths.map((month) => (
                <button
                  key={month}
                  type="button"
                  onClick={() => setSelectedMonth(month)}
                  className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${
                    month === reviewMonth
                      ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                      : "border-slate-800 bg-slate-900/50 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {formatMonthShort(month)}
                </button>
              ))}
            </div>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Cashflow i majątek są historyczne dla wybranego miesiąca.
              Goals, Debt i Progression pokazują aktualny snapshot.
            </p>
          </div>

          <div
            className={`rounded-2xl border px-5 py-4 ${verdict.className}`}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-70">
              Freedom Verdict
            </p>
            <p className="mt-1 text-xl font-black">{verdict.label}</p>
          </div>
        </header>

        <section className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Dochód"
            value={formatMoney(income)}
            icon={<CircleDollarSign size={20} />}
            detail={`${incomes.length} transakcji`}
          />
          <MetricCard
            label="Wydatki"
            value={formatMoney(expense)}
            icon={<WalletCards size={20} />}
            detail={`${expenses.length} transakcji`}
          />
          <MetricCard
            label="Nadwyżka"
            value={formatSignedMoney(surplus)}
            icon={surplus >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
            detail="wynik miesiąca"
            positive={surplus >= 0}
          />
          <MetricCard
            label="Savings rate"
            value={`${savingsRate.toFixed(1)}%`}
            icon={<Gauge size={20} />}
            detail="dochód → nadwyżka"
            positive={savingsRate >= 20}
          />
        </section>

        <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
          <Panel title="Wealth" icon={<ArrowUpRight size={19} />}>
            <BigValue
              label="Majątek netto"
              value={
                reviewedNetWorth === null
                  ? "Brak snapshotu"
                  : formatMoney(reviewedNetWorth)
              }
            />

            <div className="mt-5 rounded-xl border border-slate-800 bg-[#08111f] p-4">
              <p className="text-xs text-slate-500">Zmiana vs poprzedni miesiąc</p>
              <p
                className={`mt-1 text-xl font-black ${
                  netWorthChange === null
                    ? "text-slate-300"
                    : netWorthChange >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {netWorthChange === null
                  ? "Brak wcześniejszego snapshotu"
                  : formatSignedMoney(netWorthChange)}
              </p>
              {previousSnapshot && (
                <p className="mt-1 text-xs text-slate-600">
                  Punkt odniesienia: {formatMoney(previousSnapshot.value)}
                </p>
              )}
            </div>
          </Panel>

          <Panel
            title="Debt"
            icon={<Landmark size={19} />}
            badge={isLatestMonth ? undefined : "CURRENT"}
          >
            <BigValue label="Pozostały dług" value={formatMoney(totalDebt)} />

            <div className="mt-5 grid grid-cols-2 gap-3">
              <MiniMetric
                label="Kapitał / mies."
                value={formatMoney(monthlyPrincipal)}
              />
              <MiniMetric
                label="Odsetki / mies."
                value={formatMoney(monthlyInterest)}
              />
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-600">
              To bieżący rozkład rat z modelu zobowiązań, a nie historyczny zapis faktycznie zapłaconych rat.
            </p>
          </Panel>

          <Panel
            title="Progression"
            icon={<Trophy size={19} />}
            badge={isLatestMonth ? undefined : "CURRENT"}
          >
            <div className="flex items-end justify-between gap-4">
              <BigValue
                label={`Player Level ${playerLevel.level}`}
                value={playerLevel.name}
              />
              <div className="text-right">
                <p className="text-2xl font-black text-amber-400">
                  {totalXp.toLocaleString("pl-PL")} XP
                </p>
                <p className="text-xs text-slate-600">
                  {unlockedAchievements.length}/{achievements.length} achievements
                </p>
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                style={{ width: `${playerLevel.progress}%` }}
              />
            </div>

            <p className="mt-3 text-xs text-slate-500">
              {playerLevel.remainingXp > 0
                ? `${playerLevel.remainingXp.toLocaleString("pl-PL")} XP do następnego poziomu`
                : "Maksymalny Player Level"}
            </p>
          </Panel>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <Panel
            title="Goals Snapshot"
            icon={<Target size={19} />}
            badge={isLatestMonth ? undefined : "CURRENT"}
          >
            {activeGoals.length === 0 ? (
              <EmptyState text="Brak aktywnych celów — wszystkie domknięte. Pięknie." />
            ) : (
              <div className="space-y-4">
                {activeGoals.slice(0, 5).map((goal) => (
                  <div
                    key={goal.id}
                    className="rounded-2xl border border-slate-800 bg-[#08111f] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-black">{goal.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatMoney(goal.currentAmount)} / {formatMoney(goal.targetAmount)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-black text-cyan-400">
                          {goal.progress.toFixed(0)}%
                        </p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-slate-600">
                          brakuje {formatMoney(goal.remaining)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-400"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-4 text-xs leading-5 text-slate-600">
              Goals Snapshot pokazuje aktualny stan celów. Historyczne salda celów pojawią się po wdrożeniu miesięcznych snapshotów.
            </p>
          </Panel>

          <div className="space-y-5">
            <Panel title="Month Intelligence" icon={<Sparkles size={19} />}>
              <Insight
                label="Największa siła"
                text={strongestPoint}
                positive
              />
              <Insight
                label="Najważniejszy następny ruch"
                text={nextMove}
              />
            </Panel>

            <Panel title="Next Month" icon={<CheckCircle2 size={19} />}>
              <div className="space-y-3">
                {buildNextMonthActions({
                  savingsRate,
                  liabilities,
                  goals: activeGoals,
                }).map((action, index) => (
                  <div
                    key={`${action}-${index}`}
                    className="flex gap-3 rounded-xl border border-slate-800 bg-[#08111f] p-3"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-xs font-black text-blue-400">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-slate-300">{action}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  positive,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
          {label}
        </p>
        <div className="text-slate-500">{icon}</div>
      </div>
      <p
        className={`mt-3 text-2xl font-black ${
          positive === undefined
            ? "text-white"
            : positive
            ? "text-emerald-400"
            : "text-rose-400"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-600">{detail}</p>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
  badge,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/45 p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="text-cyan-400">{icon}</div>
          <h2 className="text-sm font-black uppercase tracking-[0.12em] text-slate-300">
            {title}
          </h2>
        </div>

        {badge && (
          <span className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-amber-400">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function BigValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#08111f] p-3">
      <p className="text-[10px] uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function Insight({
  label,
  text,
  positive = false,
}: {
  label: string;
  text: string;
  positive?: boolean;
}) {
  return (
    <div className="mb-3 rounded-xl border border-slate-800 bg-[#08111f] p-4 last:mb-0">
      <p
        className={`text-[10px] font-black uppercase tracking-[0.14em] ${
          positive ? "text-emerald-400" : "text-amber-400"
        }`}
      >
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

function getAvailableMonths(
  budget: MonthlyBudget,
  netWorthHistory: NetWorthSnapshot[]
) {
  const months = new Set<string>();

  budget.incomes.forEach((item) => {
    if (item.date) months.add(item.date.slice(0, 7));
  });

  budget.expenses.forEach((item) => {
    if (item.date) months.add(item.date.slice(0, 7));
  });

  netWorthHistory.forEach((snapshot) => {
    if (snapshot.date) months.add(snapshot.date.slice(0, 7));
  });

  return [...months].sort();
}

function getLatestMonth(budget: MonthlyBudget) {
  const dates = [
    ...budget.incomes.map((item) => item.date),
    ...budget.expenses.map((item) => item.date),
  ].filter(Boolean);

  if (dates.length === 0) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  return dates.sort().at(-1)!.slice(0, 7);
}

function formatMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);

  return new Date(year, monthNumber - 1, 1).toLocaleDateString("pl-PL", {
    month: "long",
    year: "numeric",
  });
}

function formatMonthShort(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);

  return new Date(year, monthNumber - 1, 1)
    .toLocaleDateString("pl-PL", {
      month: "short",
    })
    .replace(".", "");
}

function getVerdict(
  savingsRate: number,
  surplus: number,
  netWorthChange: number | null
) {
  if (surplus < 0 || savingsRate < 0) {
    return {
      label: "🔴 RECOVERY MONTH",
      className: "border-rose-500/25 bg-rose-500/10 text-rose-300",
    };
  }

  if (savingsRate >= 50 && (netWorthChange === null || netWorthChange >= 0)) {
    return {
      label: "🟢 STRONG MONTH",
      className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    };
  }

  if (savingsRate >= 25) {
    return {
      label: "🔵 SOLID MONTH",
      className: "border-blue-500/25 bg-blue-500/10 text-blue-300",
    };
  }

  return {
    label: "🟠 BUILDING MONTH",
    className: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  };
}

function getStrongestPoint({
  savingsRate,
  surplus,
  netWorthChange,
}: {
  savingsRate: number;
  surplus: number;
  netWorthChange: number | null;
}) {
  if (savingsRate >= 50) {
    return `${savingsRate.toFixed(1)}% savings rate — ponad połowa dochodu została jako nadwyżka.`;
  }

  if (netWorthChange !== null && netWorthChange > 0) {
    return `Majątek netto wzrósł o ${formatMoney(netWorthChange)} względem poprzedniego miesięcznego snapshotu.`;
  }

  if (surplus > 0) {
    return `Miesiąc zamknął się dodatnią nadwyżką ${formatMoney(surplus)}.`;
  }

  return "Największą wartością tego miesiąca jest pełny zapis danych — mamy bazę do poprawy kolejnego.";
}

function getNextMove({
  savingsRate,
  liabilities,
  goals,
}: {
  savingsRate: number;
  liabilities: Liability[];
  goals: Array<Goal & { progress: number; remaining: number }>;
}) {
  const expensiveDebt = [...liabilities]
    .filter((item) => item.remainingAmount > 0 && item.interestRate > 6)
    .sort((a, b) => b.interestRate - a.interestRate)[0];

  if (expensiveDebt) {
    return `${expensiveDebt.name} kosztuje ${expensiveDebt.interestRate.toLocaleString("pl-PL")}% — warto utrzymać go wysoko na liście priorytetów Routera.`;
  }

  const closestGoal = goals[0];

  if (closestGoal) {
    return `Najbliżej domknięcia jest „${closestGoal.name}” — zostało ${formatMoney(closestGoal.remaining)}.`;
  }

  if (savingsRate < 20) {
    return "Podnieś miesięczną nadwyżkę — savings rate jest obecnie poniżej 20%.";
  }

  return "Fundamenty wyglądają stabilnie — nadwyżkę można dalej kierować przez Money Router.";
}

function buildNextMonthActions({
  savingsRate,
  liabilities,
  goals,
}: {
  savingsRate: number;
  liabilities: Liability[];
  goals: Array<Goal & { progress: number; remaining: number }>;
}) {
  const actions: string[] = [];

  const expensiveDebt = [...liabilities]
    .filter((item) => item.remainingAmount > 0 && item.interestRate > 6)
    .sort((a, b) => b.interestRate - a.interestRate)[0];

  if (expensiveDebt) {
    actions.push(
      `Utrzymaj „${expensiveDebt.name}” w Debt Intelligence — oprocentowanie ${expensiveDebt.interestRate.toLocaleString("pl-PL")}%.`
    );
  }

  if (goals.length > 0) {
    actions.push(
      `Kontynuuj „${goals[0].name}” — do celu zostało ${formatMoney(goals[0].remaining)}.`
    );
  }

  actions.push(
    savingsRate >= 50
      ? "Broń savings rate ≥ 50% w kolejnym miesiącu."
      : "Spróbuj podnieść savings rate względem bieżącego miesiąca."
  );

  return actions.slice(0, 3);
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString("pl-PL")} zł`;
}

function formatSignedMoney(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${Math.round(value).toLocaleString("pl-PL")} zł`;
}
