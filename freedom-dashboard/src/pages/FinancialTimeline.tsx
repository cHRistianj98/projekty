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
            <WealthChart points={chartPoints} min={chartMin} range={chartRange} />
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
                    className="w-full cursor-pointer rounded-3xl border border-slate-800 bg-[#08111f] p-5 text-left transition hover:-translate-y-0.5 hover:border-slate-700 hover:bg-[#0a1525] hover:shadow-[0_14px_45px_rgba(0,0,0,0.22)]"
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

function WealthChart({
  points,
  min,
  range,
}: {
  points: TimelineMonth[];
  min: number;
  range: number;
}) {
  const width = 1000;
  const height = 280;
  const left = 96;
  const right = 28;
  const top = 22;
  const bottom = 54;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const axisMin = min;
  const axisMax = min + range;
  const tickCount = 5;

  const coords = points.map((point, index) => {
    const value = point.netWorth ?? 0;
    const x =
      points.length === 1
        ? left + plotWidth / 2
        : left + (index / (points.length - 1)) * plotWidth;
    const normalized = (value - axisMin) / Math.max(axisMax - axisMin, 1);
    const y = top + (1 - normalized) * plotHeight;
    return { ...point, value, x, y };
  });

  const line = coords.map((point) => `${point.x},${point.y}`).join(" ");
  const area =
    coords.length > 0
      ? `M ${coords[0].x} ${height - bottom} L ${coords
          .map((point) => `${point.x} ${point.y}`)
          .join(" L ")} L ${coords[coords.length - 1].x} ${height - bottom} Z`
      : "";

  const yTicks = Array.from({ length: tickCount }, (_, index) => {
    const ratio = index / (tickCount - 1);
    return {
      value: axisMax - ratio * (axisMax - axisMin),
      y: top + ratio * plotHeight,
    };
  });

  return (
    <div className="mt-7 overflow-x-auto">
      <div className="min-w-[760px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[290px] w-full overflow-visible"
          role="img"
          aria-label="Wykres historii Net Worth"
        >
          <defs>
            <linearGradient id="timelineArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(34 211 238)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="rgb(37 99 235)" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="timelineLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgb(59 130 246)" />
              <stop offset="100%" stopColor="rgb(34 211 238)" />
            </linearGradient>
          </defs>

          {/* Y grid + labels */}
          {yTicks.map((tick, index) => (
            <g key={index}>
              <line
                x1={left}
                x2={width - right}
                y1={tick.y}
                y2={tick.y}
                stroke="rgb(30 41 59)"
                strokeWidth="1"
                strokeDasharray={index === tickCount - 1 ? undefined : "5 8"}
              />
              <text
                x={left - 14}
                y={tick.y + 4}
                textAnchor="end"
                fill="rgb(100 116 139)"
                fontSize="11"
                fontWeight="800"
              >
                {formatAxisMoney(tick.value)}
              </text>
            </g>
          ))}

          {/* Strong axes */}
          <line
            x1={left}
            x2={left}
            y1={top}
            y2={height - bottom}
            stroke="rgb(71 85 105)"
            strokeWidth="2"
          />
          <line
            x1={left}
            x2={width - right}
            y1={height - bottom}
            y2={height - bottom}
            stroke="rgb(71 85 105)"
            strokeWidth="2"
          />

          <text
            x={20}
            y={top + plotHeight / 2}
            transform={`rotate(-90 20 ${top + plotHeight / 2})`}
            textAnchor="middle"
            fill="rgb(100 116 139)"
            fontSize="10"
            fontWeight="900"
            letterSpacing="1.5"
          >
            NET WORTH · PLN
          </text>

          {coords.length > 1 && <path d={area} fill="url(#timelineArea)" />}
          {coords.length > 1 && (
            <polyline
              points={line}
              fill="none"
              stroke="url(#timelineLine)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {coords.map((point) => (
            <g key={point.month} className="group cursor-pointer">
              <line
                x1={point.x}
                x2={point.x}
                y1={height - bottom}
                y2={height - bottom + 7}
                stroke="rgb(71 85 105)"
                strokeWidth="2"
              />
              <circle cx={point.x} cy={point.y} r="15" fill="transparent" />
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill={point.closed ? "rgb(52 211 153)" : point.live ? "rgb(34 211 238)" : "rgb(96 165 250)"}
                stroke="rgb(5 11 22)"
                strokeWidth="4"
                className="transition-all group-hover:r-[8px]"
              />
              <text
                x={point.x}
                y={height - 24}
                textAnchor="middle"
                fill="rgb(148 163 184)"
                fontSize="11"
                fontWeight="900"
              >
                {shortMonth(point.month).toUpperCase()}
              </text>
              <title>{`${formatMonth(point.month)} · ${formatMoney(point.value)}`}</title>
            </g>
          ))}

          <text
            x={left + plotWidth / 2}
            y={height - 3}
            textAnchor="middle"
            fill="rgb(100 116 139)"
            fontSize="10"
            fontWeight="900"
            letterSpacing="1.5"
          >
            MIESIĄC
          </text>
        </svg>

        <div className="mt-1 flex items-center gap-5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" />Closed</span>
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-400" />Live</span>
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-400" />Partial</span>
        </div>
      </div>
    </div>
  );
}

function formatAxisMoney(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toLocaleString("pl-PL", { maximumFractionDigits: 1 })} mln`;
  if (abs >= 1_000) return `${Math.round(value / 1_000).toLocaleString("pl-PL")}k`;
  return Math.round(value).toLocaleString("pl-PL");
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
    <div className="group rounded-3xl border border-slate-800 bg-[#08111f] p-5 transition hover:-translate-y-1 hover:border-slate-700 hover:bg-[#0a1525] hover:shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
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
