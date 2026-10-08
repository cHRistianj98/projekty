import { useId, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, ChartPie, ChartNoAxesCombined } from "lucide-react";
import type { Asset } from "../../types/Asset";
import type { MoneyFlowOverview } from "../../types/GoalAllocation";
import type { LiabilityAllocationOverview } from "../../types/LiabilityAllocation";
import type { MonthlySnapshot } from "../../types/MonthlySnapshot";
import type { PortfolioWallet } from "../../types/Portfolio";
import { portfolioHistory, wealthBreakdown, type Breakdown } from "./portfolioView";
import { useLanguage } from "../../i18n/LanguageContext";

export function Donut({ rows, total, small = false }: { rows: Breakdown[]; total?: number; small?: boolean }) {
  const { language, locale } = useLanguage();
  const displayMoney = (value: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "PLN", maximumFractionDigits: 2 }).format(value);
  const positive = rows.filter(row => row.value > 0).sort((a, b) => b.value - a.value);
  const sum = positive.reduce((value, row) => value + row.value, 0);
  const shadowId = `donutShadow-${useId().replace(/:/g, "")}`;
  let offset = 0;
  return <div className={small ? "investment-donut small" : "investment-donut"}>
    <svg viewBox={small ? "0 0 120 120" : "0 0 120 126"} role="img" aria-label={positive.length ? positive.map(row => `${row.name}: ${displayMoney(row.value)}`).join(", ") : language === "pl" ? "Brak aktywów" : "No assets"}>
      {!small && <defs>
        <filter id={shadowId} x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000814" floodOpacity=".65"/></filter>
      </defs>}
      {!small && <g className="investment-donut-depth" transform="translate(0 5)">
        <circle cx="60" cy="60" r="47" fill="none" stroke="#07111f" strokeWidth="17" />
        {(() => {
          let depthOffset = 0;
          return positive.map(row => {
            const length = row.value / sum * 100;
            const start = depthOffset; depthOffset += length;
            return <circle key={`depth-${row.id}`} cx="60" cy="60" r="47" fill="none" stroke={row.color} strokeWidth="17" pathLength="100" strokeDasharray={`${Math.max(0, length - (positive.length > 1 ? .5 : 0))} 100`} strokeDashoffset={-start} transform="rotate(-90 60 60)"/>;
          });
        })()}
      </g>}
      <g filter={small ? undefined : `url(#${shadowId})`}>
        <circle cx="60" cy="60" r="47" fill="none" stroke="#15243b" strokeWidth={small ? 20 : 16} />
        {positive.map(row => {
          const length = row.value / sum * 100;
          const start = offset; offset += length;
          return <circle key={row.id} cx="60" cy="60" r="47" fill="none" stroke={row.color} strokeWidth={small ? 20 : 16}
            pathLength="100" strokeDasharray={`${Math.max(0, length - (positive.length > 1 ? .5 : 0))} 100`}
            strokeDashoffset={-start} transform="rotate(-90 60 60)"><title>{row.name}: {displayMoney(row.value)}</title></circle>;
        })}
      </g>
      {!small && <circle cx="60" cy="60" r="35.5" className="investment-donut-inner"/>}
    </svg>
    {!small && <div className="investment-donut-label"><strong>{displayMoney(total ?? sum)}</strong><span>{language === "pl" ? "Łączny majątek" : "Total net worth"}</span></div>}
  </div>;
}

export function WealthChart({ assets, wallets, overview, liabilityOverview, total, snapshots }: {
  assets: Asset[]; wallets: PortfolioWallet[]; overview: MoneyFlowOverview | null; liabilityOverview?: LiabilityAllocationOverview | null; total: number; snapshots: MonthlySnapshot[];
}) {
  const { language, locale } = useLanguage();
  const ui = (pl: string, en: string) => language === "pl" ? pl : en;
  const displayMoney = (value: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "PLN", maximumFractionDigits: 2 }).format(value);
  const displayPercent = (value: number, base: number) => `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(base > 0 ? value / base * 100 : 0)}%`;
  const [mode, setMode] = useState<"portfolios" | "assets" | "goals">("portfolios");
  const rows = [...wealthBreakdown(mode, assets, wallets, overview, liabilityOverview ?? null)]
    .sort((a, b) => b.value - a.value);
  const chartTotal = rows.reduce((sum, row) => sum + Math.max(0, row.value), 0);
  const monthlyChanges = mode === "portfolios"
    ? portfolioMonthlyChanges(assets, wallets, snapshots)
    : mode === "assets"
      ? assetCategoryMonthlyChanges(assets, snapshots)
      : new Map<string, number>();
  return <section className="investment-panel wealth-panel">
    <div className="investment-panel-heading">
      <h2><span className="investment-section-icon"><ChartPie size={19} /></span>{ui("Podział majątku", "Wealth breakdown")}</h2>
      <div className="investment-tabs" aria-label={ui("Podział majątku", "Wealth breakdown")}>
        {([["portfolios", ui("Wg portfeli", "By portfolio")], ["assets", ui("Wg klas aktywów", "By asset class")], ["goals", ui("Wg celów", "By goal")]] as const).map(([key, label]) =>
          <button key={key} type="button" aria-pressed={mode === key} className={mode === key ? "active" : ""} onClick={() => setMode(key)}>{label}</button>)}
      </div>
    </div>
    <div className="wealth-chart-body">
      <Donut rows={rows} total={total} />
      <div className="wealth-legend">
        {rows.filter(row => row.value !== 0).map(row => {
          const change = monthlyChanges.get(row.id);
          return <div key={row.id}>
            <span className="investment-dot" style={{ background: row.color }} /><span className="legend-name">{row.name}</span>
            {change != null && Math.abs(change) > 0.005 && <span
              className={`legend-month-change ${change > 0 ? "positive" : "negative"}`}
              title={mode === "assets" ? ui("Zmiana wartości klasy aktywów względem ostatniego zamkniętego miesiąca", "Asset-class value change vs the last closed month") : ui("Zmiana wartości całego portfela względem ostatniego zamkniętego miesiąca", "Portfolio value change vs the last closed month")}
              aria-label={`${ui("Zmiana miesiąc do miesiąca", "Month-over-month change")}: ${change > 0 ? ui("wzrost", "increase") : ui("spadek", "decrease")} ${Math.abs(change).toLocaleString(locale, { maximumFractionDigits: 1 })}%`}
            >
              {change > 0 ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
              {Math.abs(change).toLocaleString(locale, { maximumFractionDigits: 1 })}%
            </span>}
            <strong>{displayMoney(row.value)}</strong><span className="legend-share">{row.value >= 0 ? displayPercent(row.value, chartTotal) : "—"}</span>
          </div>;
        })}
        {!rows.some(row => row.value !== 0) && <p className="investment-empty">{ui("Dodaj aktywa, aby zobaczyć podział majątku.", "Add assets to see the wealth breakdown.")}</p>}
      </div>
    </div>
    {rows.some(row => row.value < 0) && <p className="investment-note">{ui("Wykres i udziały pokazują dodatnie wartości. Suma uwzględnia również ujemne salda.", "The chart and shares show positive values. The total also includes negative balances.")}</p>}
  </section>;
}

function portfolioMonthlyChanges(assets: Asset[], wallets: PortfolioWallet[], snapshots: MonthlySnapshot[]) {
  const result = new Map<string, number>();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const previous = snapshots
    .filter(snapshot => snapshot.month < currentMonth)
    .sort((a, b) => b.month.localeCompare(a.month))[0];

  if (!previous) return result;

  const currentAssetById = new Map(assets.map(asset => [asset.id, asset]));

  for (const wallet of wallets.filter(wallet => wallet.type !== "GOALS")) {
    const currentValue = assets
      .filter(asset => asset.portfolioId === wallet.id)
      .reduce((sum, asset) => sum + asset.value, 0);

    let previousValue = 0;
    let comparableAssets = 0;

    for (const snapshotAsset of previous.assets) {
      const currentAsset = currentAssetById.get(snapshotAsset.id);
      if (currentAsset?.portfolioId !== wallet.id) continue;
      previousValue += snapshotAsset.value;
      comparableAssets += 1;
    }

    if (comparableAssets === 0 || previousValue <= 0) continue;
    result.set(String(wallet.id), (currentValue - previousValue) / previousValue * 100);
  }

  return result;
}

function assetCategoryMonthlyChanges(assets: Asset[], snapshots: MonthlySnapshot[]) {
  const result = new Map<string, number>();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const previous = snapshots
    .filter(snapshot => snapshot.month < currentMonth)
    .sort((a, b) => b.month.localeCompare(a.month))[0];

  if (!previous) return result;

  const currentByCategory = new Map<string, number>();
  for (const asset of assets) {
    const category = asset.category ?? "other";
    currentByCategory.set(category, (currentByCategory.get(category) ?? 0) + asset.value);
  }

  const previousByCategory = new Map<string, number>();
  for (const asset of previous.assets) {
    const category = asset.category;
    if (!category) continue;
    previousByCategory.set(category, (previousByCategory.get(category) ?? 0) + asset.value);
  }

  for (const [category, currentValue] of currentByCategory) {
    const previousValue = previousByCategory.get(category);
    if (previousValue == null || previousValue <= 0) continue;
    result.set(category, (currentValue - previousValue) / previousValue * 100);
  }

  return result;
}

export function HistoryChart({ snapshots, total }: { snapshots: MonthlySnapshot[]; total: number }) {
  const { language, locale } = useLanguage();
  const ui = (pl: string, en: string) => language === "pl" ? pl : en;
  const displayMoney = (value: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "PLN", maximumFractionDigits: 2 }).format(value);
  const [period, setPeriod] = useState("1R");
  const gradient = useId().replace(/:/g, "");
  const data = portfolioHistory(snapshots, total, { "6M": 6, "1R": 12, "5L": 60, MAX: null }[period] ?? null);
  return <section className="investment-panel history-panel">
    <div className="investment-panel-heading">
      <h2><span className="investment-section-icon"><ChartNoAxesCombined size={17} /></span>{ui("Wartość portfeli w czasie", "Portfolio value over time")}</h2>
      <div className="investment-periods" aria-label={ui("Okres wykresu", "Chart period")}>
        {["6M", "1R", "5L", "MAX"].map(item => <button type="button" key={item} aria-pressed={period === item} onClick={() => setPeriod(item)} className={period === item ? "active" : ""}>{language === "en" ? ({ "1R": "1Y", "5L": "5Y" } as Record<string, string>)[item] ?? item : item}</button>)}
      </div>
    </div>
    <div className="portfolio-history-chart">
      <div className="history-current"><span>{ui("Dzisiaj", "Today")}</span><strong>{displayMoney(total)}</strong></div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 28, right: 10, left: -16, bottom: 0 }}>
          <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2479ff" stopOpacity={.36}/><stop offset="100%" stopColor="#2479ff" stopOpacity={.015}/></linearGradient></defs>
          <CartesianGrid stroke="#14253b" vertical={true} />
          <XAxis dataKey="time" type="number" domain={["dataMin", "dataMax"]} scale="time" minTickGap={35} tickLine={false} axisLine={{ stroke: "#34465e" }} tick={{ fill: "#a2b9d7", fontSize: 10 }}
            tickFormatter={value => new Date(value).toLocaleDateString(locale, { month: "short" })} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#a2b9d7", fontSize: 10 }} tickFormatter={value => Intl.NumberFormat(locale, { notation: "compact" }).format(value)} />
          <Tooltip contentStyle={{ background: "#071322", border: "1px solid #25476c", borderRadius: 9, color: "#fff" }}
            labelFormatter={value => new Date(Number(value)).toLocaleDateString(locale, { month: "long", year: "numeric" })}
            formatter={value => [displayMoney(Number(value)), ui("Wartość aktywów", "Asset value")]} />
          <Area type="linear" dataKey="value" stroke="#318bff" strokeWidth={2} fill={`url(#${gradient})`} dot={{ r: 3, fill: "#318bff", stroke: "#071322", strokeWidth: 1 }} activeDot={{ r: 5 }} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <p className="investment-note">{data.length === 1 ? ui("Pierwszy punkt: stan bieżący. Zamknij miesiąc, aby budować historię.", "First point: current value. Close a month to build history.") : ui("Wartość aktywów z zamkniętych miesięcy i stan bieżący.", "Asset value from closed months plus the current value.")}</p>
  </section>;
}
