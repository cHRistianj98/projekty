import { useId, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartPie, ChartNoAxesCombined } from "lucide-react";
import type { Asset } from "../../types/Asset";
import type { MoneyFlowOverview } from "../../types/GoalAllocation";
import type { MonthlySnapshot } from "../../types/MonthlySnapshot";
import type { PortfolioWallet } from "../../types/Portfolio";
import { money, percent, portfolioHistory, wealthBreakdown, type Breakdown } from "./portfolioView";

export function Donut({ rows, total, small = false }: { rows: Breakdown[]; total?: number; small?: boolean }) {
  const positive = rows.filter(row => row.value > 0);
  const sum = positive.reduce((value, row) => value + row.value, 0);
  let offset = 0;
  return <div className={small ? "investment-donut small" : "investment-donut"}>
    <svg viewBox="0 0 120 120" role="img" aria-label={positive.length ? positive.map(row => `${row.name}: ${money(row.value)}`).join(", ") : "Brak aktywów"}>
      <circle cx="60" cy="60" r="47" fill="none" stroke="#15243b" strokeWidth="20" />
      {positive.map(row => {
        const length = row.value / sum * 100;
        const start = offset; offset += length;
        return <circle key={row.id} cx="60" cy="60" r="47" fill="none" stroke={row.color} strokeWidth="20"
          pathLength="100" strokeDasharray={`${Math.max(0, length - (positive.length > 1 ? .45 : 0))} 100`}
          strokeDashoffset={-start} transform="rotate(-90 60 60)"><title>{row.name}: {money(row.value)}</title></circle>;
      })}
    </svg>
    {!small && <div className="investment-donut-label"><strong>{money(total ?? sum)}</strong><span>Łączny majątek</span></div>}
  </div>;
}

export function WealthChart({ assets, wallets, overview, total }: {
  assets: Asset[]; wallets: PortfolioWallet[]; overview: MoneyFlowOverview | null; total: number;
}) {
  const [mode, setMode] = useState<"portfolios" | "assets" | "goals">("portfolios");
  const rows = wealthBreakdown(mode, assets, wallets, overview);
  const chartTotal = rows.reduce((sum, row) => sum + Math.max(0, row.value), 0);
  return <section className="investment-panel wealth-panel">
    <div className="investment-panel-heading">
      <h2><span className="investment-section-icon"><ChartPie size={19} /></span>Podział majątku</h2>
      <div className="investment-tabs" aria-label="Podział majątku">
        {([["portfolios", "Wg portfeli"], ["assets", "Wg klas aktywów"], ["goals", "Wg celów"]] as const).map(([key, label]) =>
          <button key={key} type="button" aria-pressed={mode === key} className={mode === key ? "active" : ""} onClick={() => setMode(key)}>{label}</button>)}
      </div>
    </div>
    <div className="wealth-chart-body">
      <Donut rows={rows} total={total} />
      <div className="wealth-legend">
        {rows.filter(row => row.value !== 0).map(row => <div key={row.id}>
          <span className="investment-dot" style={{ background: row.color }} /><span className="legend-name">{row.name}</span>
          <strong>{money(row.value)}</strong><span className="legend-share">{row.value >= 0 ? percent(row.value, chartTotal) : "—"}</span>
        </div>)}
        {!rows.some(row => row.value !== 0) && <p className="investment-empty">Dodaj aktywa, aby zobaczyć podział majątku.</p>}
      </div>
    </div>
    {rows.some(row => row.value < 0) && <p className="investment-note">Wykres i udziały pokazują dodatnie wartości. Suma uwzględnia również ujemne salda.</p>}
  </section>;
}

export function HistoryChart({ snapshots, total }: { snapshots: MonthlySnapshot[]; total: number }) {
  const [period, setPeriod] = useState("1R");
  const gradient = useId().replace(/:/g, "");
  const data = portfolioHistory(snapshots, total, { "6M": 6, "1R": 12, "5L": 60, MAX: null }[period] ?? null);
  return <section className="investment-panel history-panel">
    <div className="investment-panel-heading">
      <h2><span className="investment-section-icon"><ChartNoAxesCombined size={17} /></span>Wartość portfeli w czasie</h2>
      <div className="investment-periods" aria-label="Okres wykresu">
        {["6M", "1R", "5L", "MAX"].map(item => <button type="button" key={item} aria-pressed={period === item} onClick={() => setPeriod(item)} className={period === item ? "active" : ""}>{item}</button>)}
      </div>
    </div>
    <div className="portfolio-history-chart">
      <div className="history-current"><span>Dzisiaj</span><strong>{money(total)}</strong></div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 28, right: 10, left: -16, bottom: 0 }}>
          <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2479ff" stopOpacity={.36}/><stop offset="100%" stopColor="#2479ff" stopOpacity={.015}/></linearGradient></defs>
          <CartesianGrid stroke="#14253b" vertical={true} />
          <XAxis dataKey="time" type="number" domain={["dataMin", "dataMax"]} scale="time" minTickGap={35} tickLine={false} axisLine={{ stroke: "#34465e" }} tick={{ fill: "#a2b9d7", fontSize: 10 }}
            tickFormatter={value => new Date(value).toLocaleDateString("pl-PL", { month: "short" })} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#a2b9d7", fontSize: 10 }} tickFormatter={value => Intl.NumberFormat("pl-PL", { notation: "compact" }).format(value)} />
          <Tooltip contentStyle={{ background: "#071322", border: "1px solid #25476c", borderRadius: 9, color: "#fff" }}
            labelFormatter={value => new Date(Number(value)).toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}
            formatter={value => [money(Number(value)), "Wartość aktywów"]} />
          <Area type="linear" dataKey="value" stroke="#318bff" strokeWidth={2} fill={`url(#${gradient})`} dot={{ r: 3, fill: "#318bff", stroke: "#071322", strokeWidth: 1 }} activeDot={{ r: 5 }} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <p className="investment-note">{data.length === 1 ? "Pierwszy punkt: stan bieżący. Zamknij miesiąc, aby budować historię." : "Wartość aktywów z zamkniętych miesięcy i stan bieżący."}</p>
  </section>;
}
