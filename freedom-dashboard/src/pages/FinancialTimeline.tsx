import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  History,
  LockKeyhole,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import type { MonthlyBudget } from "../types/Cashflow";
import type { MonthlySnapshot } from "../types/MonthlySnapshot";
import type { NetWorthSnapshot } from "../types/NetWorthHistory";

type FinancialTimelineProps = {
  netWorth: number;
  monthlyBudget: MonthlyBudget;
  netWorthHistory: NetWorthSnapshot[];
  monthlySnapshots: MonthlySnapshot[];
};

type TimelineMonth = {
  month: string;
  netWorth: number | null;
  income: number;
  expenses: number;
  surplus: number;
  savingsRate: number;
  totalXp: number | null;
  level: number | null;
  levelName: string | null;
  closed: boolean;
  live: boolean;
  delta: number | null;
};

export function FinancialTimeline({
  netWorth,
  monthlyBudget,
  netWorthHistory,
  monthlySnapshots,
}: FinancialTimelineProps) {
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  const months = useMemo<TimelineMonth[]>(() => {
    const currentMonth = getCurrentMonth();
    const monthSet = new Set<string>();

    monthlyBudget.incomes.forEach((item) => monthSet.add(item.date.slice(0, 7)));
    monthlyBudget.expenses.forEach((item) => monthSet.add(item.date.slice(0, 7)));
    netWorthHistory.forEach((item) => monthSet.add(item.date.slice(0, 7)));
    monthlySnapshots.forEach((item) => monthSet.add(item.month));
    monthSet.add(currentMonth);

    const ordered = [...monthSet].sort();

    const raw = ordered.map((month) => {
      const snapshot = monthlySnapshots.find((item) => item.month === month);
      const history = [...netWorthHistory]
        .filter((item) => item.date.slice(0, 7) === month)
        .sort((a, b) => a.date.localeCompare(b.date))
        .at(-1);

      const incomes = monthlyBudget.incomes.filter((item) => item.date.slice(0, 7) === month);
      const expenses = monthlyBudget.expenses.filter((item) => item.date.slice(0, 7) === month);

      const liveIncome = sum(incomes.map((item) => item.amount));
      const liveExpenses = sum(expenses.map((item) => item.amount));
      const liveSurplus = liveIncome - liveExpenses;

      const income = snapshot?.cashflow.income ?? liveIncome;
      const expense = snapshot?.cashflow.expenses ?? liveExpenses;
      const surplus = snapshot?.cashflow.surplus ?? liveSurplus;
      const savingsRate =
        snapshot?.cashflow.savingsRate ??
        (income > 0 ? (surplus / income) * 100 : 0);

      return {
        month,
        netWorth:
          snapshot?.wealth.netWorth ??
          history?.value ??
          (month === currentMonth ? netWorth : null),
        income,
        expenses: expense,
        surplus,
        savingsRate,
        totalXp: snapshot?.player.totalXp ?? null,
        level: snapshot?.player.level ?? null,
        levelName: snapshot?.player.levelName ?? null,
        closed: Boolean(snapshot),
        live: month === currentMonth && !snapshot,
        delta: null,
      };
    });

    return raw.map((item, index) => {
      if (index === 0 || item.netWorth === null) return item;
      const previous = raw[index - 1].netWorth;
      return {
        ...item,
        delta: previous === null ? null : item.netWorth - previous,
      };
    }).reverse();
  }, [monthlyBudget, monthlySnapshots, netWorthHistory, netWorth]);

  const closedMonths = months.filter((item) => item.closed).length;
  const newest = months[0];
  const oldest = months.at(-1);
  const totalGrowth =
    newest?.netWorth != null && oldest?.netWorth != null
      ? newest.netWorth - oldest.netWorth
      : null;

  const chartPoints = [...months]
    .reverse()
    .filter((item) => item.netWorth !== null);

  const chartMin = Math.min(...chartPoints.map((item) => item.netWorth ?? 0), 0);
  const chartMax = Math.max(...chartPoints.map((item) => item.netWorth ?? 0), 1);
  const chartRange = Math.max(chartMax - chartMin, 1);

  return (
    <main className="min-h-screen bg-[#050b16] p-8 text-white">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
              <History size={16} />
              FREEDOM 7.0
            </div>
            <h1 className="mt-3 text-4xl font-black tracking-tight">
              Financial Timeline
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Twój finansowy save game — miesiąc po miesiącu. Zamknięte miesiące
              korzystają z immutable snapshotów, a bieżący miesiąc pokazuje dane live.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#08111f] px-5 py-4">
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">
              Timeline status
            </div>
            <div className="mt-1 text-sm font-bold text-slate-200">
              {months.length} miesięcy · {closedMonths} closed
            </div>
          </div>
        </div>

        <section className="mt-7 grid gap-4 md:grid-cols-3">
          <SummaryCard
            label="Current Net Worth"
            value={formatMoney(newest?.netWorth ?? netWorth)}
            detail={newest ? formatMonth(newest.month) : "Teraz"}
            icon={<WalletCards size={18} />}
          />
          <SummaryCard
            label="Timeline Growth"
            value={totalGrowth === null ? "—" : signedMoney(totalGrowth)}
            detail="od pierwszego punktu historii"
            icon={<TrendingUp size={18} />}
          />
          <SummaryCard
            label="Closed Months"
            value={`${closedMonths}`}
            detail="immutable snapshots"
            icon={<LockKeyhole size={18} />}
          />
        </section>

        <section className="mt-6 rounded-3xl border border-slate-800 bg-[#08111f] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Wealth trajectory
              </p>
              <h2 className="mt-1 text-lg font-bold">Net Worth</h2>
            </div>
            <Sparkles className="text-violet-400" size={20} />
          </div>

          {chartPoints.length > 0 ? (
            <div className="mt-7 flex h-48 items-end gap-2">
              {chartPoints.map((point) => {
                const value = point.netWorth ?? 0;
                const height = 18 + ((value - chartMin) / chartRange) * 82;
                return (
                  <div key={point.month} className="group flex min-w-0 flex-1 flex-col items-center justify-end">
                    <div className="mb-2 hidden whitespace-nowrap text-[10px] font-bold text-slate-300 group-hover:block">
                      {formatMoney(value)}
                    </div>
                    <div
                      className="w-full max-w-16 rounded-t-lg bg-gradient-to-t from-blue-700 to-cyan-400 transition hover:brightness-125"
                      style={{ height: `${height}%` }}
                    />
                    <div className="mt-2 text-[10px] font-bold uppercase text-slate-600">
                      {shortMonth(point.month)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-600">
              Zamknij pierwszy miesiąc, aby rozpocząć historię Net Worth.
            </div>
          )}
        </section>

        <section className="relative mt-8">
          <div className="absolute bottom-0 left-[23px] top-0 w-px bg-slate-800" />

          <div className="space-y-4">
            {months.map((item) => {
              const expanded = expandedMonth === item.month;
              return (
                <article key={item.month} className="relative pl-16">
                  <div
                    className={`absolute left-[15px] top-7 z-10 h-4 w-4 rounded-full border-4 border-[#050b16] ${
                      item.closed ? "bg-emerald-400" : item.live ? "bg-cyan-400" : "bg-slate-600"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setExpandedMonth(expanded ? null : item.month)}
                    className="w-full rounded-3xl border border-slate-800 bg-[#08111f] p-5 text-left transition hover:border-slate-700 hover:bg-[#0a1525]"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-[180px]">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-black">{formatMonth(item.month)}</h3>
                          <StatusBadge item={item} />
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          {item.closed
                            ? "Zamrożony obraz miesiąca"
                            : item.live
                              ? "Bieżące dane — jeszcze niezamknięte"
                              : "Historyczne dane częściowe"}
                        </p>
                      </div>

                      <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-4">
                        <Metric label="Net Worth" value={item.netWorth === null ? "—" : formatMoney(item.netWorth)} />
                        <Metric label="Δ Net Worth" value={item.delta === null ? "—" : signedMoney(item.delta)} positive={item.delta} />
                        <Metric label="Surplus" value={signedMoney(item.surplus)} positive={item.surplus} />
                        <Metric label="Savings Rate" value={`${item.savingsRate.toFixed(1)}%`} positive={item.savingsRate} />
                      </div>

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 text-slate-500">
                        {expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                      </div>
                    </div>

                    {expanded && (
                      <div className="mt-5 grid gap-3 border-t border-slate-800 pt-5 sm:grid-cols-2 lg:grid-cols-5">
                        <Detail label="Income" value={formatMoney(item.income)} />
                        <Detail label="Expenses" value={formatMoney(item.expenses)} />
                        <Detail label="Surplus" value={signedMoney(item.surplus)} />
                        <Detail label="Player XP" value={item.totalXp === null ? "LIVE" : `${item.totalXp.toLocaleString("pl-PL")} XP`} />
                        <Detail
                          label="Player Level"
                          value={item.level === null ? "LIVE" : `Lv. ${item.level} · ${item.levelName}`}
                        />
                      </div>
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-[#08111f] p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600">{label}</p>
        <div className="text-cyan-400">{icon}</div>
      </div>
      <div className="mt-3 text-2xl font-black">{value}</div>
      <div className="mt-1 text-xs text-slate-600">{detail}</div>
    </div>
  );
}

function Metric({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: number | null;
}) {
  const tone =
    positive == null
      ? "text-white"
      : positive > 0
        ? "text-emerald-300"
        : positive < 0
          ? "text-red-300"
          : "text-white";

  return (
    <div>
      <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">{label}</div>
      <div className={`mt-1 text-sm font-black ${tone}`}>{value}</div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#050b16] p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">{label}</div>
      <div className="mt-2 text-sm font-bold text-slate-200">{value}</div>
    </div>
  );
}

function StatusBadge({ item }: { item: TimelineMonth }) {
  if (item.closed) {
    return (
      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-300">
        Closed
      </span>
    );
  }

  if (item.live) {
    return (
      <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-cyan-300">
        Live
      </span>
    );
  }

  return (
    <span className="rounded-full border border-slate-700 bg-slate-800/60 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
      Partial
    </span>
  );
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString("pl-PL")} PLN`;
}

function signedMoney(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${Math.round(value).toLocaleString("pl-PL")} PLN`;
}

function formatMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("pl-PL", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
}

function shortMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("pl-PL", { month: "short" })
    .format(new Date(year, monthNumber - 1, 1))
    .replace(".", "");
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
