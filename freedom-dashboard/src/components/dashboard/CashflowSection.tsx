import { ArrowDownRight, ArrowRight, ArrowUpRight, CircleDollarSign, Home, PiggyBank, Plus, ShoppingBasket, Target, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ExpenseCategory, MonthlyBudget } from "../../types/Cashflow";

type Props = { budget: MonthlyBudget; onAddExpenseClick: () => void };

const categoryMeta: Record<ExpenseCategory, { label: string; icon: typeof Home; bar: string; iconClass: string }> = {
  fixed: { label: "Stałe", icon: Home, bar: "bg-red-500", iconClass: "bg-red-500/10 text-red-400" },
  living: { label: "Życie", icon: ShoppingBasket, bar: "bg-amber-400", iconClass: "bg-amber-500/10 text-amber-400" },
  investment: { label: "Inwestycje", icon: TrendingUp, bar: "bg-blue-500", iconClass: "bg-blue-500/10 text-blue-400" },
  goal: { label: "Cele", icon: Target, bar: "bg-violet-500", iconClass: "bg-violet-500/10 text-violet-400" },
};
const money = (value: number) => `${value.toLocaleString("pl-PL", { maximumFractionDigits: 0 })} zł`;

export function CashflowSection({ budget, onAddExpenseClick }: Props) {
  const navigate = useNavigate();
  const income = budget.incomes.reduce((sum, item) => sum + item.amount, 0);
  const expenses = budget.expenses.reduce((sum, item) => sum + item.amount, 0);
  const surplus = income - expenses;
  const savingsRate = income > 0 ? (surplus / income) * 100 : 0;
  const totals = budget.expenses.reduce<Record<ExpenseCategory, number>>((acc, item) => { acc[item.category] += item.amount; return acc; }, { fixed: 0, living: 0, investment: 0, goal: 0 });
  const categories = (Object.entries(totals) as [ExpenseCategory, number][]).sort((a, b) => b[1] - a[1]);
  const biggest = categories[0];
  const recent = [...budget.expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <section className="mt-6 rounded-2xl border border-slate-800 bg-[#0b1322] p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Monthly Cashflow</p><h2 className="mt-2 text-lg font-black text-white">Wydatki pod kontrolą</h2><p className="mt-1 text-xs text-slate-500">Szybki obraz miesiąca bez starego wielkiego donuta.</p></div>
        <div className="flex gap-2"><button onClick={onAddExpenseClick} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-500"><Plus size={15} /> Dodaj wydatek</button><button onClick={() => navigate("/finances")} className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800">Finanse <ArrowRight size={14} /></button></div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <FlowMetric label="Wpływy" value={money(income)} icon={<ArrowUpRight size={18} />} tone="emerald" />
        <FlowMetric label="Wydatki" value={money(expenses)} icon={<ArrowDownRight size={18} />} tone="red" />
        <FlowMetric label="Wolne środki" value={money(surplus)} icon={<CircleDollarSign size={18} />} tone={surplus >= 0 ? "blue" : "red"} />
        <FlowMetric label="Savings rate" value={`${savingsRate.toFixed(1)}%`} icon={<PiggyBank size={18} />} tone="violet" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_.95fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/35 p-5">
          <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-slate-400">Top kategorie</p><p className="mt-1 text-[11px] text-slate-600">Gdzie realnie uciekają pieniądze</p></div>{biggest && <span className="rounded-lg bg-amber-500/10 px-2 py-1 text-[10px] font-black text-amber-400">TOP: {categoryMeta[biggest[0]].label}</span>}</div>
          <div className="mt-5 space-y-4">{categories.map(([key, value]) => { const meta = categoryMeta[key]; const Icon = meta.icon; const pct = expenses > 0 ? (value / expenses) * 100 : 0; return <div key={key}><div className="mb-2 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${meta.iconClass}`}><Icon size={15} /></span><div><p className="text-xs font-bold text-slate-200">{meta.label}</p><p className="text-[10px] text-slate-600">{pct.toFixed(1)}% wydatków</p></div></div><p className="text-xs font-black text-white">{money(value)}</p></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${pct}%` }} /></div></div>; })}</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/35 p-5">
          <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-slate-400">Ostatnie wydatki</p><p className="mt-1 text-[11px] text-slate-600">Najświeższe transakcje miesiąca</p></div><button onClick={() => navigate("/finances")} className="text-[11px] font-bold text-blue-400 hover:text-blue-300">Wszystkie →</button></div>
          <div className="mt-4 divide-y divide-slate-800/80">{recent.length ? recent.map((item) => { const meta = categoryMeta[item.category]; const Icon = meta.icon; return <div key={item.id} className="flex items-center justify-between gap-3 py-3"><div className="flex min-w-0 items-center gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.iconClass}`}><Icon size={16} /></span><div className="min-w-0"><p className="truncate text-xs font-bold text-slate-200">{item.name}</p><p className="mt-0.5 text-[10px] text-slate-600">{meta.label} • {item.date}</p></div></div><p className="shrink-0 text-xs font-black text-white">-{money(item.amount)}</p></div>; }) : <div className="py-10 text-center text-xs text-slate-600">Brak wydatków w tym miesiącu.</div>}</div>
        </div>
      </div>
    </section>
  );
}

function FlowMetric({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: "emerald" | "red" | "blue" | "violet" }) {
  const cls = { emerald: "bg-emerald-500/10 text-emerald-400", red: "bg-red-500/10 text-red-400", blue: "bg-blue-500/10 text-blue-400", violet: "bg-violet-500/10 text-violet-400" }[tone];
  return <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${cls}`}>{icon}</div><p className="mt-3 text-[10px] font-black uppercase tracking-wider text-slate-600">{label}</p><p className="mt-1 text-lg font-black text-white">{value}</p></div>;
}
