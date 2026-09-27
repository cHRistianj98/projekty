import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  Gauge,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import type { Expense, ExpenseCategory, Income, MonthlyBudget } from "../types/Cashflow";
import type { NetWorthSnapshot } from "../types/NetWorthHistory";

type AnalyticsProps = {
  monthlyBudget: MonthlyBudget;
  netWorthHistory: NetWorthSnapshot[];
  netWorth: number;
};

type Period = 6 | 12 | 24;
type Tone = "blue" | "emerald" | "red" | "amber" | "violet";

type MonthData = {
  month: string;
  label: string;
  income: number;
  expenses: number;
  surplus: number;
  savingsRate: number;
  rollingSurplus3M: number | null;
};

type NetWorthPoint = { date: string; label: string; value: number };
type IncomeAnomaly = { transaction: Income; reason: string };

const categoryLabels: Record<ExpenseCategory, string> = {
  fixed: "Stałe",
  living: "Życie",
  investment: "Inwestycje",
  goal: "Cele",
};

const categoryColors: Record<ExpenseCategory, string> = {
  fixed: "#3b82f6",
  living: "#8b5cf6",
  investment: "#10b981",
  goal: "#f59e0b",
};

export function Analytics({ monthlyBudget, netWorthHistory, netWorth }: AnalyticsProps) {
  const [period, setPeriod] = useState<Period>(12);

  const months = useMemo(
    () => buildMonthlyAnalytics(monthlyBudget, period),
    [monthlyBudget, period]
  );

  const monthKeys = useMemo(() => months.map((item) => item.month), [months]);
  const periodExpenses = useMemo(
    () => getExpensesForMonths(monthlyBudget.expenses, monthKeys),
    [monthlyBudget.expenses, monthKeys]
  );
  const periodIncomes = useMemo(
    () => getIncomesForMonths(monthlyBudget.incomes, monthKeys),
    [monthlyBudget.incomes, monthKeys]
  );

  const totalIncome = months.reduce((sum, item) => sum + item.income, 0);
  const totalExpenses = months.reduce((sum, item) => sum + item.expenses, 0);
  const totalSurplus = totalIncome - totalExpenses;
  const averageSavingsRate = totalIncome > 0 ? (totalSurplus / totalIncome) * 100 : 0;

  const monthsWithIncome = months.filter((item) => item.income > 0);
  const monthsWithExpenses = months.filter((item) => item.expenses > 0);
  const averageIncome = monthsWithIncome.length ? totalIncome / monthsWithIncome.length : 0;
  const averageExpenses = monthsWithExpenses.length ? totalExpenses / monthsWithExpenses.length : 0;

  const bestMonth = getBestMonth(months);
  const worstMonth = getWorstMonth(months);
  const categoryTotals = calculateCategoryTotals(periodExpenses);
  const biggestCategory = getBiggestCategory(categoryTotals);
  const netWorthPoints = useMemo(
    () => buildNetWorthPoints(netWorthHistory, netWorth, months),
    [netWorthHistory, netWorth, months]
  );
  const netWorthChange = calculateNetWorthChange(netWorthPoints);
  const incomeAnomalies = useMemo(() => detectIncomeAnomalies(periodIncomes), [periodIncomes]);

  const currentMonth = months[months.length - 1];
  const previousMonth = months[months.length - 2];
  const savingsMomentum =
    currentMonth && previousMonth && currentMonth.income > 0 && previousMonth.income > 0
      ? currentMonth.savingsRate - previousMonth.savingsRate
      : null;

  return (
    <main className="min-h-screen bg-[#050b16] p-5 text-white md:p-8">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-400" />
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-400">Analytics</p>
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Twoje finanse w czasie</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Terminal Twojej finansowej gry: majątek, cashflow, momentum i tempo budowania wolności.
          </p>
        </div>
        <PeriodSelector period={period} onChange={setPeriod} />
      </section>

      {incomeAnomalies.length > 0 && <AnomalyBanner anomalies={incomeAnomalies} />}

      <section className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Średni przychód" value={formatMoney(averageIncome)} subtitle={`Średnia z ${monthsWithIncome.length} mies.`} icon={<TrendingUp size={19} />} tone="emerald" />
        <Metric label="Średnie wydatki" value={formatMoney(averageExpenses)} subtitle={`Średnia z ${monthsWithExpenses.length} mies.`} icon={<WalletCards size={19} />} tone="red" />
        <Metric label="Łączna nadwyżka" value={formatSignedMoney(totalSurplus)} subtitle={`Ostatnie ${period} miesięcy`} icon={<PiggyBank size={19} />} tone={totalSurplus >= 0 ? "blue" : "red"} />
        <Metric label="Savings rate" value={`${averageSavingsRate.toFixed(1)}%`} subtitle="Dla całego okresu" icon={<Gauge size={19} />} tone={averageSavingsRate >= 50 ? "emerald" : averageSavingsRate >= 20 ? "amber" : "red"} />
      </section>

      <Panel className="mt-5">
        <PanelHeader eyebrow="WEALTH // NET WORTH" title="Majątek netto" subtitle="Twój finansowy wykres główny" right={
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-slate-600">Zmiana w okresie</p>
            <p className={`mt-1 text-xl font-black ${netWorthChange == null ? "text-slate-400" : netWorthChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {netWorthChange == null ? "Brak danych" : formatSignedMoney(netWorthChange)}
            </p>
          </div>
        } />
        <div className="mt-6"><NetWorthChart points={netWorthPoints} /></div>
      </Panel>

      <section className="mt-5 grid grid-cols-1 gap-5 2xl:grid-cols-5">
        <Panel className="2xl:col-span-3">
          <PanelHeader eyebrow="CASHFLOW // FLOW" title="Przychody vs wydatki" subtitle={`Ostatnie ${period} miesięcy`} right={<ChartLegend items={[{label:"Przychody",color:"#10b981"},{label:"Wydatki",color:"#ef4444"}]} />} />
          <div className="mt-6"><CashflowChart months={months} /></div>
        </Panel>

        <Panel className="2xl:col-span-2">
          <PanelHeader eyebrow="SPENDING // ALLOCATION" title="Struktura wydatków" subtitle="Gdzie znika kapitał" />
          <div className="mt-7"><SpendingDonut totals={categoryTotals} total={totalExpenses} /></div>
        </Panel>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-5 2xl:grid-cols-5">
        <Panel className="2xl:col-span-3">
          <PanelHeader eyebrow="MOMENTUM // SURPLUS" title="Miesięczna nadwyżka" subtitle="Bilans miesiąca + średnia krocząca 3M" right={<ChartLegend items={[{label:"Nadwyżka",color:"#3b82f6"},{label:"Średnia 3M",color:"#8b5cf6"}]} />} />
          <div className="mt-6"><SurplusChart months={months} /></div>
        </Panel>

        <Panel className="2xl:col-span-2">
          <PanelHeader eyebrow="EFFICIENCY // SCORE" title="Savings rate" subtitle="Ile dochodu zostaje w Twojej kieszeni" right={
            savingsMomentum == null ? undefined : <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${savingsMomentum >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{savingsMomentum >= 0 ? "+" : ""}{savingsMomentum.toFixed(1)} pp</span>
          } />
          <div className="mt-6"><SavingsRateChart months={months} /></div>
        </Panel>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <InsightCard eyebrow="Najlepszy miesiąc" title={bestMonth ? formatMonthLong(bestMonth.month) : "Brak danych"} value={bestMonth ? formatSignedMoney(bestMonth.surplus) : "—"} description="Najwyższa miesięczna nadwyżka." icon={<ArrowUpRight size={20} />} tone="emerald" />
        <InsightCard eyebrow="Najsłabszy miesiąc" title={worstMonth ? formatMonthLong(worstMonth.month) : "Brak danych"} value={worstMonth ? formatSignedMoney(worstMonth.surplus) : "—"} description="Najniższy miesięczny bilans." icon={<ArrowDownRight size={20} />} tone="red" />
        <InsightCard eyebrow="Największy koszt" title={biggestCategory ? categoryLabels[biggestCategory.category] : "Brak danych"} value={biggestCategory ? formatMoney(biggestCategory.value) : "—"} description="Największa kategoria wydatków w okresie." icon={<CircleDollarSign size={20} />} tone="violet" />
      </section>

      <Panel className="mt-5">
        <PanelHeader eyebrow="FREEDOM INTELLIGENCE" title="Kluczowe wnioski" subtitle="Szybki odczyt sytuacji bez przekopywania wykresów" />
        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Signal label="Kapitał" value={netWorthChange == null ? "Za mało historii" : netWorthChange >= 0 ? `Majątek urósł o ${formatMoney(netWorthChange)}` : `Majątek spadł o ${formatMoney(Math.abs(netWorthChange))}`} positive={netWorthChange != null ? netWorthChange >= 0 : null} />
          <Signal label="Efektywność" value={averageSavingsRate >= 50 ? `Savings rate ${averageSavingsRate.toFixed(1)}% — mocne tempo` : `Savings rate ${averageSavingsRate.toFixed(1)}% — jest przestrzeń do poprawy`} positive={averageSavingsRate >= 50} />
          <Signal label="Cashflow" value={currentMonth ? `${formatMonthLong(currentMonth.month)}: ${formatSignedMoney(currentMonth.surplus)}` : "Brak danych"} positive={currentMonth ? currentMonth.surplus >= 0 : null} />
        </div>
      </Panel>
    </main>
  );
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-800 bg-[#0b1322] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-6 ${className}`}>{children}</section>;
}

function PanelHeader({ eyebrow, title, subtitle, right }: { eyebrow: string; title: string; subtitle: string; right?: ReactNode }) {
  return <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
    <div><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-400/80">{eyebrow}</p><h2 className="mt-2 text-xl font-black">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div>
    {right}
  </div>;
}

function PeriodSelector({ period, onChange }: { period: Period; onChange: (period: Period) => void }) {
  return <div className="flex rounded-xl border border-slate-800 bg-slate-900/70 p-1.5">
    {([6,12,24] as Period[]).map((option) => <button key={option} type="button" onClick={() => onChange(option)} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${period === option ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-slate-500 hover:bg-slate-800 hover:text-white"}`}>{option}M</button>)}
  </div>;
}

function Metric({ label, value, subtitle, icon, tone }: { label: string; value: string; subtitle: string; icon: ReactNode; tone: Tone }) {
  const styles: Record<Tone,string> = { blue:"bg-blue-500/10 text-blue-400", emerald:"bg-emerald-500/10 text-emerald-400", red:"bg-red-500/10 text-red-400", amber:"bg-amber-500/10 text-amber-400", violet:"bg-violet-500/10 text-violet-400" };
  return <div className="group rounded-2xl border border-slate-800 bg-[#0b1322] p-5 transition hover:-translate-y-0.5 hover:border-slate-700">
    <div className="flex items-start justify-between gap-3"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-black tracking-tight">{value}</p></div><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles[tone]}`}>{icon}</div></div>
    <p className="mt-3 text-xs text-slate-600">{subtitle}</p>
  </div>;
}

function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return <div className="flex flex-wrap gap-4 text-xs text-slate-500">{items.map(item => <div key={item.label} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{background:item.color}} />{item.label}</div>)}</div>;
}

function NetWorthChart({ points }: { points: NetWorthPoint[] }) {
  if (points.length < 2) return <EmptyState text="Potrzeba co najmniej dwóch punktów historii Net Worth." />;
  const width=1100, height=360, left=92, right=28, top=22, bottom=54;
  const values=points.map(p=>p.value);
  const rawMin=Math.min(...values), rawMax=Math.max(...values);
  const pad=Math.max((rawMax-rawMin)*0.15, rawMax*0.03, 1000);
  const min=Math.max(0, rawMin-pad), max=rawMax+pad, range=Math.max(max-min,1);
  const x=(i:number)=>left+(i/Math.max(points.length-1,1))*(width-left-right);
  const y=(v:number)=>top+((max-v)/range)*(height-top-bottom);
  const coords=points.map((p,i)=>({...p,x:x(i),y:y(p.value)}));
  const line=coords.map(p=>`${p.x},${p.y}`).join(" ");
  const area=`M ${coords[0].x} ${height-bottom} L ${coords.map(p=>`${p.x} ${p.y}`).join(" L ")} L ${coords[coords.length-1].x} ${height-bottom} Z`;
  const ticks=5;
  return <div className="overflow-x-auto"><div className="min-w-[760px]">
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[360px] w-full" role="img" aria-label="Wykres majątku netto">
      <defs><linearGradient id="nwFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28"/><stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      {Array.from({length:ticks+1},(_,i)=>{const value=max-(i/ticks)*range; const yy=y(value); return <g key={i}><line x1={left} x2={width-right} y1={yy} y2={yy} stroke="#1e293b" strokeWidth="1"/><text x={left-14} y={yy+4} textAnchor="end" fill="#64748b" fontSize="12">{formatAxisMoney(value)}</text></g>})}
      <line x1={left} x2={left} y1={top} y2={height-bottom} stroke="#334155"/><line x1={left} x2={width-right} y1={height-bottom} y2={height-bottom} stroke="#334155"/>
      <path d={area} fill="url(#nwFill)"/><polyline points={line} fill="none" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)"/>
      {coords.map((p,i)=><g key={`${p.date}-${i}`}><circle cx={p.x} cy={p.y} r="5" fill="#60a5fa" stroke="#0b1322" strokeWidth="3"><title>{`${p.label}: ${formatMoney(p.value)}`}</title></circle>{(i===0||i===coords.length-1||i%Math.ceil(coords.length/6)===0)&&<text x={p.x} y={height-22} textAnchor="middle" fill="#64748b" fontSize="11">{p.label}</text>}</g>)}
      <text x="18" y={height/2} fill="#475569" fontSize="11" transform={`rotate(-90 18 ${height/2})`} textAnchor="middle">MAJĄTEK NETTO (PLN)</text>
    </svg>
    <div className="mt-1 flex flex-wrap gap-5 border-t border-slate-800/70 pt-4 text-xs text-slate-500"><span>Start: <strong className="text-slate-300">{formatMoney(points[0].value)}</strong></span><span>Teraz: <strong className="text-slate-300">{formatMoney(points[points.length-1].value)}</strong></span><span>ATH okresu: <strong className="text-blue-400">{formatMoney(rawMax)}</strong></span></div>
  </div></div>;
}

function CashflowChart({ months }: { months: MonthData[] }) {
  const width=900,height=320,left=76,right=20,top=18,bottom=48;
  const max=Math.max(...months.flatMap(m=>[m.income,m.expenses]),1)*1.12;
  const y=(v:number)=>top+(1-v/max)*(height-top-bottom);
  const plotW=width-left-right, groupW=plotW/months.length, barW=Math.min(18,groupW*.24);
  return <div className="overflow-x-auto"><svg viewBox={`0 0 ${width} ${height}`} className="h-80 min-w-[720px] w-full">
    {[0,.25,.5,.75,1].map((r,i)=>{const val=max*(1-r),yy=y(val);return <g key={i}><line x1={left} x2={width-right} y1={yy} y2={yy} stroke="#1e293b"/><text x={left-12} y={yy+4} textAnchor="end" fill="#64748b" fontSize="11">{formatAxisMoney(val)}</text></g>})}
    {months.map((m,i)=>{const cx=left+groupW*i+groupW/2; return <g key={m.month}><rect x={cx-barW-2} y={y(m.income)} width={barW} height={height-bottom-y(m.income)} rx="4" fill="#10b981"><title>{`Przychody ${formatMoney(m.income)}`}</title></rect><rect x={cx+2} y={y(m.expenses)} width={barW} height={height-bottom-y(m.expenses)} rx="4" fill="#ef4444"><title>{`Wydatki ${formatMoney(m.expenses)}`}</title></rect><text x={cx} y={height-20} textAnchor="middle" fill="#64748b" fontSize="11">{m.label}</text></g>})}
    <text x="16" y={height/2} fill="#475569" fontSize="10" transform={`rotate(-90 16 ${height/2})`} textAnchor="middle">PLN / MIESIĄC</text>
  </svg></div>;
}

function SurplusChart({ months }: { months: MonthData[] }) {
  const width=900,height=320,left=76,right=20,top=18,bottom=48;
  const maxMag=Math.max(...months.flatMap(m=>[Math.abs(m.surplus),Math.abs(m.rollingSurplus3M??0)]),1)*1.18;
  const y=(v:number)=>top+((maxMag-v)/(maxMag*2))*(height-top-bottom);
  const zero=y(0), plotW=width-left-right, step=plotW/Math.max(months.length,1), barW=Math.min(24,step*.38);
  const rolling=months.map((m,i)=>m.rollingSurplus3M==null?null:{x:left+step*i+step/2,y:y(m.rollingSurplus3M)}).filter(Boolean) as {x:number;y:number}[];
  return <div className="overflow-x-auto"><svg viewBox={`0 0 ${width} ${height}`} className="h-80 min-w-[720px] w-full">
    {[-1,-.5,0,.5,1].map((r,i)=>{const val=maxMag*r,yy=y(val);return <g key={i}><line x1={left} x2={width-right} y1={yy} y2={yy} stroke={r===0?"#475569":"#1e293b"}/><text x={left-12} y={yy+4} textAnchor="end" fill="#64748b" fontSize="11">{formatAxisMoney(val)}</text></g>})}
    {months.map((m,i)=>{const cx=left+step*i+step/2, yy=y(m.surplus), h=Math.abs(zero-yy);return <g key={m.month}><rect x={cx-barW/2} y={Math.min(yy,zero)} width={barW} height={Math.max(h,1)} rx="4" fill={m.surplus>=0?"#3b82f6":"#ef4444"}><title>{`Nadwyżka ${formatSignedMoney(m.surplus)}`}</title></rect><text x={cx} y={height-20} textAnchor="middle" fill="#64748b" fontSize="11">{m.label}</text></g>})}
    {rolling.length>1&&<polyline points={rolling.map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>}
    {rolling.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#a78bfa"/>)}
    <text x="16" y={height/2} fill="#475569" fontSize="10" transform={`rotate(-90 16 ${height/2})`} textAnchor="middle">NADWYŻKA (PLN)</text>
  </svg></div>;
}

function SavingsRateChart({ months }: { months: MonthData[] }) {
  const width=650,height=320,left=64,right=18,top=18,bottom=48;
  const min=-25,max=100, plotW=width-left-right,step=plotW/Math.max(months.length-1,1);
  const y=(v:number)=>top+((max-v)/(max-min))*(height-top-bottom);
  const valid=months.map((m,i)=>m.income>0?{x:left+i*step,y:y(Math.max(min,Math.min(max,m.savingsRate))),m}:null).filter(Boolean) as {x:number;y:number;m:MonthData}[];
  return <div className="overflow-x-auto"><svg viewBox={`0 0 ${width} ${height}`} className="h-80 min-w-[560px] w-full">
    {[100,75,50,25,0,-25].map(v=><g key={v}><line x1={left} x2={width-right} y1={y(v)} y2={y(v)} stroke={v===50?"#065f46":"#1e293b"} strokeDasharray={v===50?"6 6":undefined}/><text x={left-10} y={y(v)+4} textAnchor="end" fill={v===50?"#10b981":"#64748b"} fontSize="11">{v}%</text></g>)}
    {valid.length>1&&<polyline points={valid.map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>}
    {valid.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="5" fill="#34d399" stroke="#0b1322" strokeWidth="3"><title>{`${p.m.label}: ${p.m.savingsRate.toFixed(1)}%`}</title></circle>)}
    {months.map((m,i)=><text key={m.month} x={left+i*step} y={height-20} textAnchor="middle" fill="#64748b" fontSize="11">{m.label}</text>)}
    <text x={width-right-4} y={y(50)-8} textAnchor="end" fill="#10b981" fontSize="10">CEL 50%</text>
  </svg></div>;
}

function SpendingDonut({ totals, total }: { totals: Record<ExpenseCategory,number>; total:number }) {
  if(total<=0) return <EmptyState text="Brak wydatków w analizowanym okresie."/>;
  const cats=Object.keys(totals) as ExpenseCategory[];
  let cursor=0;
  const stops=cats.map(cat=>{const start=cursor; const pct=totals[cat]/total*100; cursor+=pct; return `${categoryColors[cat]} ${start}% ${cursor}%`;}).join(", ");
  return <div className="grid items-center gap-8 md:grid-cols-[190px_1fr] 2xl:grid-cols-1 2xl:justify-items-center 3xl:grid-cols-[190px_1fr]">
    <div className="relative h-44 w-44 rounded-full" style={{background:`conic-gradient(${stops})`}}><div className="absolute inset-[22px] flex flex-col items-center justify-center rounded-full bg-[#0b1322]"><span className="text-[10px] uppercase tracking-widest text-slate-600">Wydatki</span><strong className="mt-1 text-lg">{formatCompactMoney(total)}</strong></div></div>
    <div className="w-full space-y-3">{cats.map(cat=>{const pct=totals[cat]/total*100;return <div key={cat} className="rounded-xl border border-slate-800/80 bg-slate-950/20 p-3"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{background:categoryColors[cat]}}/><span className="text-sm text-slate-300">{categoryLabels[cat]}</span></div><strong className="text-sm">{formatMoney(totals[cat])}</strong></div><div className="mt-2 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full" style={{width:`${pct}%`,background:categoryColors[cat]}}/></div><span className="w-12 text-right text-[11px] text-slate-500">{pct.toFixed(1)}%</span></div></div>})}</div>
  </div>;
}

function InsightCard({ eyebrow,title,value,description,icon,tone }:{eyebrow:string;title:string;value:string;description:string;icon:ReactNode;tone:Tone}) {
  const styles:Record<Tone,string>={blue:"bg-blue-500/10 text-blue-400",emerald:"bg-emerald-500/10 text-emerald-400",red:"bg-red-500/10 text-red-400",amber:"bg-amber-500/10 text-amber-400",violet:"bg-violet-500/10 text-violet-400"};
  return <div className="rounded-2xl border border-slate-800 bg-[#0b1322] p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">{eyebrow}</p><h3 className="mt-2 font-bold text-slate-300">{title}</h3></div><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles[tone]}`}>{icon}</div></div><p className="mt-5 text-2xl font-black">{value}</p><p className="mt-2 text-xs leading-5 text-slate-600">{description}</p></div>;
}

function Signal({label,value,positive}:{label:string;value:string;positive:boolean|null}) {
  return <div className="rounded-xl border border-slate-800 bg-slate-950/25 p-4"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${positive==null?"bg-slate-500":positive?"bg-emerald-400":"bg-red-400"}`}/><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">{label}</p></div><p className="mt-2 text-sm font-semibold text-slate-300">{value}</p></div>;
}

function AnomalyBanner({ anomalies }: { anomalies: IncomeAnomaly[] }) {
  const first=anomalies[0];
  return <section className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5"><div className="flex items-start gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400"><AlertTriangle size={20}/></div><div><p className="font-bold text-amber-300">Wykryto nietypową wartość</p><p className="mt-1 text-sm leading-6 text-slate-400">„<span className="font-semibold text-slate-200">{first.transaction.name}</span>” z {formatDate(first.transaction.date)}: <span className="font-bold text-amber-300">{formatMoney(first.transaction.amount)}</span>. {first.reason}</p>{anomalies.length>1&&<p className="mt-2 text-xs text-amber-400/80">+ {anomalies.length-1} kolejna/e nietypowa/e transakcja/e.</p>}<p className="mt-2 text-xs text-slate-600">Analytics niczego nie zmienia — tylko sygnalizuje dane do sprawdzenia w Finansach.</p></div></div></section>;
}

function EmptyState({text}:{text:string}) { return <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">{text}</div>; }

function buildMonthlyAnalytics(budget: MonthlyBudget, period: number): MonthData[] {
  const currentMonth=getCurrentMonth();
  const keys=Array.from({length:period},(_,i)=>getMonthWithOffset(currentMonth,i-(period-1)));
  const base=keys.map(month=>{
    const income=sumAmounts(budget.incomes.filter(x=>x.date?.startsWith(month)));
    const expenses=sumAmounts(budget.expenses.filter(x=>x.date?.startsWith(month)));
    const surplus=income-expenses;
    return {month,label:formatMonthShort(month),income,expenses,surplus,savingsRate:income>0?(surplus/income)*100:0,rollingSurplus3M:null as number|null};
  });
  return base.map((item,index)=>{
    if(index<2) return item;
    const window=base.slice(index-2,index+1);
    if(!window.some(m=>m.income>0||m.expenses>0)) return item;
    return {...item,rollingSurplus3M:window.reduce((s,m)=>s+m.surplus,0)/3};
  });
}

function getExpensesForMonths(expenses:Expense[],months:string[]){const set=new Set(months);return expenses.filter(x=>set.has(x.date?.slice(0,7)??""));}
function getIncomesForMonths(incomes:Income[],months:string[]){const set=new Set(months);return incomes.filter(x=>set.has(x.date?.slice(0,7)??""));}
function sumAmounts<T extends {amount:number}>(items:T[]){return items.reduce((s,x)=>s+x.amount,0);}
function getBestMonth(months:MonthData[]){const x=months.filter(m=>m.income>0||m.expenses>0);return x.length?[...x].sort((a,b)=>b.surplus-a.surplus)[0]:null;}
function getWorstMonth(months:MonthData[]){const x=months.filter(m=>m.income>0||m.expenses>0);return x.length?[...x].sort((a,b)=>a.surplus-b.surplus)[0]:null;}
function calculateCategoryTotals(expenses:Expense[]):Record<ExpenseCategory,number>{const t={fixed:0,living:0,investment:0,goal:0};expenses.forEach(x=>t[x.category]+=x.amount);return t;}
function getBiggestCategory(totals:Record<ExpenseCategory,number>){const x=(Object.entries(totals) as [ExpenseCategory,number][]).sort((a,b)=>b[1]-a[1])[0];return !x||x[1]<=0?null:{category:x[0],value:x[1]};}

function buildNetWorthPoints(history:NetWorthSnapshot[],current:number,months:MonthData[]):NetWorthPoint[]{
  if(!months.length)return[];
  const start=`${months[0].month}-01`;
  const points=[...history].filter(x=>x.date>=start).sort((a,b)=>a.date.localeCompare(b.date)).map(x=>({date:x.date,label:formatDateShort(x.date),value:x.value}));
  const today=getTodayIso(),last=points[points.length-1];
  if(!last||last.date!==today||last.value!==current)points.push({date:today,label:formatDateShort(today),value:current});
  const map=new Map<string,NetWorthPoint>();points.forEach(p=>map.set(p.date,p));return [...map.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
function calculateNetWorthChange(points:NetWorthPoint[]){return points.length<2?null:points[points.length-1].value-points[0].value;}

function detectIncomeAnomalies(incomes:Income[]):IncomeAnomaly[]{
  const values=incomes.filter(x=>x.amount>0).map(x=>x.amount).sort((a,b)=>a-b);if(!values.length)return[];
  const median=getMedian(values);
  return incomes.filter(x=>x.amount>=1_000_000||(values.length>=2&&median>0&&x.amount>=median*8&&x.amount>=100_000)).sort((a,b)=>b.amount-a.amount).map(transaction=>({transaction,reason:transaction.amount>=1_000_000?"Kwota przekracza 1 mln zł i mocno wpływa na skalę wykresów.":"Kwota jest wielokrotnie wyższa od typowych przychodów w tym okresie."}));
}
function getMedian(values:number[]){if(!values.length)return 0;const m=Math.floor(values.length/2);return values.length%2===0?(values[m-1]+values[m])/2:values[m];}

function getCurrentMonth(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;}
function getTodayIso(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function getMonthWithOffset(month:string,offset:number){const [y,m]=month.split("-").map(Number);const d=new Date(y,m-1+offset,1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;}
function formatMonthShort(month:string){const[y,m]=month.split("-").map(Number);return new Intl.DateTimeFormat("pl-PL",{month:"short"}).format(new Date(y,m-1,1)).replace(".","");}
function formatMonthLong(month:string){const[y,m]=month.split("-").map(Number);const s=new Intl.DateTimeFormat("pl-PL",{month:"long",year:"numeric"}).format(new Date(y,m-1,1));return s.charAt(0).toUpperCase()+s.slice(1);}
function formatDate(date:string){return new Intl.DateTimeFormat("pl-PL",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(`${date}T12:00:00`));}
function formatDateShort(date:string){return new Intl.DateTimeFormat("pl-PL",{day:"2-digit",month:"short"}).format(new Date(`${date}T12:00:00`)).replace(".","");}
function formatMoney(value:number){return `${Math.round(value).toLocaleString("pl-PL")} zł`;}
function formatSignedMoney(value:number){return `${value>=0?"+":"−"}${Math.round(Math.abs(value)).toLocaleString("pl-PL")} zł`;}
function formatCompactMoney(value:number){const abs=Math.abs(value);if(abs>=1_000_000)return `${(value/1_000_000).toFixed(abs>=10_000_000?1:2)} mln zł`;if(abs>=1000)return `${(value/1000).toFixed(abs>=100_000?0:1)} tys. zł`;return formatMoney(value);}
function formatAxisMoney(value:number){const abs=Math.abs(value);const sign=value<0?"−":"";if(abs>=1_000_000)return `${sign}${(abs/1_000_000).toFixed(abs>=10_000_000?0:1)}M`;if(abs>=1000)return `${sign}${Math.round(abs/1000)}k`;return `${sign}${Math.round(abs)}`;}
