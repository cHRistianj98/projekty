import { useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Banknote,
  BrainCircuit,
  CreditCard,
  Landmark,
  LockKeyhole,
  Pencil,
  Percent,
  PiggyBank,
  Plus,
  ShieldCheck,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import { AddLiabilityModal } from "../components/liabilities/AddLiabilityModal";
import { EditLiabilityModal } from "../components/liabilities/EditLiabilityModal";
import { getLiabilityIcon } from "../components/liabilities/LiabilityVisualFields";
import type { Asset } from "../types/Asset";
import type { Liability, LiabilityType } from "../types/Liability";
import type { MoneyFlowOverview } from "../types/GoalAllocation";
import type {
  LiabilityAllocation,
  LiabilityAllocationOverview,
  LiabilityAllocationSummary,
} from "../types/LiabilityAllocation";
import { analyzeDebts, type DebtAction } from "../features/intelligence/debtIntelligence";
import { calculateMonthlyDebtPayments, calculateTotalLiabilities } from "../utils/liabilities";
import { goalAllocationApi } from "../api/goalAllocationApi";
import { liabilityAllocationApi } from "../api/liabilityAllocationApi";


type Props = {
  liabilities: Liability[];
  portfolio: Asset[];
  onAddLiability: (liability: Liability) => void;
  onUpdateLiability: (liability: Liability) => void;
  onDeleteLiability: (id: number) => void;
};

const money = (value: number) => `${value.toLocaleString("pl-PL", { maximumFractionDigits: 2 })} zł`;

export function Liabilities({
  liabilities,
  portfolio,
  onAddLiability,
  onUpdateLiability,
  onDeleteLiability,
}: Props) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [fundingLiability, setFundingLiability] = useState<Liability | null>(null);
  const [allocationOverview, setAllocationOverview] = useState<LiabilityAllocationOverview | null>(null);
  const [goalOverview, setGoalOverview] = useState<MoneyFlowOverview | null>(null);
  const [allocationError, setAllocationError] = useState("");

  async function refreshReservations() {
    try {
      const [liabilityReservations, goalReservations] = await Promise.all([
        liabilityAllocationApi.getOverview(),
        goalAllocationApi.getOverview(),
      ]);
      setAllocationOverview(liabilityReservations);
      setGoalOverview(goalReservations);
      setAllocationError("");
    } catch (error) {
      console.error("Nie udało się pobrać rezerwacji zobowiązań:", error);
      setAllocationError("Nie udało się pobrać kapitału przypisanego do zobowiązań.");
    }
  }

  useEffect(() => {
    void refreshReservations();
  }, [liabilities]);

  const totalLiabilities = calculateTotalLiabilities(liabilities);
  const monthlyPayments = calculateMonthlyDebtPayments(liabilities);
  const totalPrincipal = liabilities.reduce((sum, liability) => sum + (liability.principalPayment ?? 0), 0);
  const totalInterest = liabilities.reduce((sum, liability) => sum + (liability.interestPayment ?? 0), 0);
  const reservedForDebt = allocationOverview?.totalAllocated ?? 0;
  const effectiveUncoveredDebt = Math.max(totalLiabilities - reservedForDebt, 0);
  const debtInsights = analyzeDebts(liabilities);
  const topDebt = debtInsights[0] ?? null;
  const reservedByAsset = buildReservedByAsset(goalOverview, allocationOverview);

  function handleDelete(liability: Liability) {
    if (window.confirm(`Usunąć zobowiązanie "${liability.name}"? Rezerwy przypisane do niego zostaną zwolnione.`)) {
      onDeleteLiability(liability.id);
    }
  }

  function allocationsFor(liabilityId: number): LiabilityAllocation[] {
    return (allocationOverview?.allocations ?? [])
      .filter(row => row.liabilityId === liabilityId)
      .map((row, index) => ({
        id: row.assetId ?? -(index + 1),
        liabilityId: row.liabilityId,
        assetId: row.assetId,
        assetName: row.assetName,
        amount: row.amount,
      }));
  }

  return <main className="min-h-screen bg-[#050b16] p-8">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/15 bg-red-500/10 text-red-400 shadow-lg shadow-red-950/20"><Landmark size={24}/></div>
        <div><h1 className="text-3xl font-black tracking-tight">Zobowiązania</h1><p className="mt-1 text-sm text-slate-500">Kredyty, leasingi i inne zadłużenie. Kontroluj koszt kapitału i buduj rezerwę na spłatę.</p></div>
      </div>
      <button onClick={() => setIsAddModalOpen(true)} className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:bg-blue-500"><Plus size={18}/>Dodaj zobowiązanie</button>
    </div>

    <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      <Hero title="Łączny dług w bankach" value={money(totalLiabilities)} subtitle={`${liabilities.length} aktywnych zobowiązań`} icon={<CreditCard/>} tone="rose" ghost={<CreditCard size={92}/>}/>
      <Hero title="Odłożone na spłatę" value={money(reservedForDebt)} subtitle={`Efektywnie niepokryte: ${money(effectiveUncoveredDebt)}`} icon={<PiggyBank/>} tone="violet" ghost={<PiggyBank size={92}/>}/>
      <Hero title="Łączne raty" value={money(monthlyPayments)} subtitle="Miesięczne obciążenie bankowe" icon={<WalletCards/>} tone="amber" ghost={<WalletCards size={92}/>}/>
      <Hero title="Kapitał w ratach" value={money(totalPrincipal)} subtitle={monthlyPayments ? `${((totalPrincipal / monthlyPayments) * 100).toFixed(1)}% rat` : "Brak rat"} icon={<Banknote/>} tone="emerald" ghost={<Banknote size={92}/>}/>
      <Hero title="Odsetki w ratach" value={money(totalInterest)} subtitle={monthlyPayments ? `${((totalInterest / monthlyPayments) * 100).toFixed(1)}% rat` : "Brak rat"} icon={<Percent/>} tone="orange" ghost={<Percent size={92}/>}/>
    </section>

    {allocationError && <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300">{allocationError}</div>}

    <section className="relative mt-7 overflow-hidden rounded-3xl border border-violet-500/20 bg-[#08111f] shadow-xl shadow-black/20">
      {topDebt && <><img src={topDebt.liability.imageUrl || getDefaultLiabilityImage(topDebt.liability.type, topDebt.liability.name)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-[.16] blur-[1px]"/><div className="absolute inset-0 bg-gradient-to-r from-[#08111f] via-[#08111f]/95 to-[#08111f]/70"/></>}
      <div className="relative p-6 lg:p-7">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/20"><BrainCircuit size={23}/></div><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-400">Debt Intelligence 3.2</p><h2 className="mt-1 text-2xl font-black">Strategia zobowiązań</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Saldo bankowe pozostaje prawdą o kredycie. Rezerwa pokazuje osobno, ile Twojego majątku już pracuje na przyszłą spłatę.</p></div></div>
          {topDebt && <div className="group flex min-w-[320px] overflow-hidden rounded-2xl border border-amber-500/20 bg-slate-950/60 transition hover:-translate-y-0.5 hover:border-amber-400/35"><img src={topDebt.liability.imageUrl || getDefaultLiabilityImage(topDebt.liability.type, topDebt.liability.name)} className="h-24 w-28 object-cover transition duration-500 group-hover:scale-105"/><div className="p-4"><p className="text-[9px] font-black uppercase tracking-[.16em] text-amber-400">Pierwszy do analizy</p><p className="mt-1 text-lg font-black">{topDebt.liability.name}</p><p className="mt-1 text-xs text-slate-500">{topDebt.liability.interestRate.toLocaleString("pl-PL")}% · {formatDebtAction(topDebt.action)}</p></div></div>}
        </div>
        {debtInsights.length > 0 && <div className="mt-6 grid gap-3 xl:grid-cols-3">{debtInsights.slice(0, 3).map((insight, index) => <div key={insight.liability.id} className={`group relative min-h-[142px] overflow-hidden rounded-2xl border ${debtActionClasses(insight.action)}`}><img src={insight.liability.imageUrl || getDefaultLiabilityImage(insight.liability.type, insight.liability.name)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-[.20] transition duration-500 group-hover:scale-105 group-hover:opacity-[.27]"/><div className="absolute inset-0 bg-gradient-to-r from-[#08111f]/95 via-[#08111f]/88 to-[#08111f]/65"/><div className="relative p-4"><div className="flex justify-between gap-3"><p className="text-base font-black">#{index + 1} {insight.liability.name}</p><span className="text-xs font-black">{insight.liability.interestRate.toLocaleString("pl-PL")}%</span></div><p className="mt-2 text-[10px] font-black uppercase tracking-[.12em]">{formatDebtAction(insight.action)}</p><p className="mt-2 max-w-sm text-xs leading-5 text-slate-400">{insight.reason}</p></div></div>)}</div>}
        <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-600"><AlertTriangle size={15} className="mt-0.5 shrink-0"/><p>Rezerwa na spłatę nie jest nadpłatą. Oprocentowanie i rata nadal dotyczą salda widocznego w banku.</p></div>
      </div>
    </section>

    <section className="mt-7 space-y-5">
      {liabilities.map(liability => <LiabilityCard
        key={liability.id}
        liability={liability}
        allocations={allocationsFor(liability.id)}
        onFund={() => setFundingLiability(liability)}
        onEdit={() => setEditingLiability(liability)}
        onDelete={() => handleDelete(liability)}
      />)}
      {liabilities.length === 0 && <div className="rounded-3xl border border-dashed border-slate-700 p-16 text-center"><Landmark size={40} className="mx-auto text-slate-600"/><h2 className="mt-4 text-xl font-black">Brak zobowiązań</h2><p className="mt-2 text-sm text-slate-500">I bardzo dobrze 😎</p></div>}
    </section>

    {isAddModalOpen && <AddLiabilityModal onClose={() => setIsAddModalOpen(false)} onAdd={onAddLiability}/>} 
    {editingLiability && <EditLiabilityModal liability={editingLiability} onClose={() => setEditingLiability(null)} onUpdate={onUpdateLiability}/>} 
    {fundingLiability && <LiabilityFundingModal
      liability={fundingLiability}
      portfolio={portfolio}
      reservedByAsset={reservedByAsset}
      onClose={() => setFundingLiability(null)}
      onChanged={refreshReservations}
    />}
  </main>;
}

function LiabilityCard({
  liability: liability,
  allocations,
  onFund,
  onEdit,
  onDelete,
}: {
  liability: Liability;
  allocations: LiabilityAllocation[];
  onFund: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const bankPaid = Math.max(liability.originalAmount - liability.remainingAmount, 0);
  const reserved = allocations.reduce((sum, allocation) => sum + allocation.amount, 0);
  const effectiveRemaining = Math.max(liability.remainingAmount - reserved, 0);
  const bankPaidPercent = liability.originalAmount > 0 ? Math.min(100, bankPaid / liability.originalAmount * 100) : 0;
  const reservePercent = liability.originalAmount > 0 ? Math.min(100 - bankPaidPercent, reserved / liability.originalAmount * 100) : 0;
  const effectiveProgress = liability.originalAmount > 0 ? Math.min(100, (liability.originalAmount - effectiveRemaining) / liability.originalAmount * 100) : 0;
  const Icon = getLiabilityIcon(liability.iconKey);
  const imageSrc = liability.imageUrl || getDefaultLiabilityImage(liability.type, liability.name);
  const accent = getLiabilityAccent(liability.type);

  return <article className="group overflow-hidden rounded-2xl border border-slate-800/90 bg-[#0a1424] shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-2xl hover:shadow-black/25">
    <div className="grid min-h-[205px] lg:grid-cols-[220px_minmax(0,1fr)_330px]">
      <div className="relative min-h-[185px] overflow-hidden bg-slate-950 lg:min-h-full">
        <img src={imageSrc} alt={liability.name} className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.055] ${liability.imagePosition === "top" ? "object-top" : liability.imagePosition === "bottom" ? "object-bottom" : "object-center"}`} onError={event => { const fallback = getDefaultLiabilityImage(liability.type, liability.name); if (event.currentTarget.src.endsWith(fallback)) return; event.currentTarget.src = fallback; }}/>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0a1424]/35 lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[#0a1424]/90"/>
        <div className={`absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-950/70 ${accent.icon} shadow-lg backdrop-blur`}><Icon size={20}/></div>
        {reserved > 0 && <div className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-slate-950/80 px-2.5 py-1.5 text-[10px] font-black text-emerald-300 backdrop-blur"><LockKeyhole size={12}/>{money(reserved)} na spłatę</div>}
      </div>

      <div className="flex min-w-0 flex-col justify-center px-5 py-5 lg:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-black tracking-tight text-white">{liability.name}</h2>
          <span className={`rounded-lg border px-2 py-1 text-[9px] font-black uppercase tracking-[.12em] ${accent.badge}`}>{formatLiabilityType(liability.type)}</span>
          <span className="rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1 text-[9px] font-black text-slate-400">{liability.interestRate.toLocaleString("pl-PL")}%</span>
          {liability.interestRate >= 8 && <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-[.12em] text-amber-300">High cost</span>}
        </div>
        <p className="mt-2 text-sm text-slate-500">Bankowi spłacono {money(bankPaid)} · dodatkowo odłożono {money(reserved)}</p>

        <div className="mt-5 flex items-end gap-2">
          <p className="text-2xl font-black text-white">{money(bankPaid + reserved)}</p>
          <p className="pb-1 text-sm font-semibold text-slate-500">/ {money(liability.originalAmount)} pokryte</p>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <div className="flex h-2.5 flex-1 overflow-hidden rounded-full bg-slate-800">
            <span className={`${accent.bar} h-full transition-all duration-500`} style={{ width: `${bankPaidPercent}%` }}/>
            <span className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${reservePercent}%` }}/>
          </div>
          <span className="w-12 text-right text-base font-black text-slate-200">{effectiveProgress.toFixed(0)}%</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
          <span>Saldo bankowe: <strong className="text-slate-300">{money(liability.remainingAmount)}</strong></span>
          <span>Efektywnie niepokryte: <strong className="text-emerald-300">{money(effectiveRemaining)}</strong></span>
        </div>
        {allocations.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{allocations.slice(0, 3).map(allocation => <span key={allocation.id} className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.06] px-2 py-1 text-[10px] font-bold text-emerald-200">{allocation.assetName} · {money(allocation.amount)}</span>)}{allocations.length > 3 && <span className="px-2 py-1 text-[10px] font-bold text-slate-500">+{allocations.length - 3}</span>}</div>}
      </div>

      <div className="relative flex flex-col justify-center border-t border-slate-800/80 px-5 py-5 lg:border-l lg:border-t-0">
        <div className="absolute right-3 top-3 flex gap-1.5">
          <button type="button" onClick={onEdit} title="Edytuj" className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-blue-500/10 hover:text-blue-300"><Pencil size={17}/></button>
          <button type="button" onClick={onDelete} title="Usuń" className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-300"><Trash2 size={17}/></button>
        </div>
        <div className="grid w-full grid-cols-3 divide-x divide-slate-800 pt-5 lg:pt-0">
          <CompactStat label="Rata miesięczna" value={money(liability.monthlyPayment)}/>
          <CompactStat label="W banku" value={money(liability.remainingAmount)} accent="text-blue-300"/>
          <CompactStat label="Po rezerwie" value={money(effectiveRemaining)} accent="text-emerald-300"/>
        </div>
        <button type="button" onClick={onFund} className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs font-black text-emerald-300 transition hover:border-emerald-400/45 hover:bg-emerald-500/15"><PiggyBank size={16}/>{reserved > 0 ? "Zarządzaj rezerwą" : "Przypisz środki"}</button>
      </div>
    </div>
  </article>;
}

function LiabilityFundingModal({
  liability,
  portfolio,
  reservedByAsset,
  onClose,
  onChanged,
}: {
  liability: Liability;
  portfolio: Asset[];
  reservedByAsset: Map<number, number>;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const [summary, setSummary] = useState<LiabilityAllocationSummary | null>(null);
  const [assetId, setAssetId] = useState<number | null>(portfolio[0]?.id ?? null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    liabilityAllocationApi.getSummary(liability.id)
      .then(value => { if (!cancelled) setSummary(value); })
      .catch(reason => { console.error(reason); if (!cancelled) setError("Nie udało się pobrać rezerwy zobowiązania."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [liability.id]);

  const selectedAsset = portfolio.find(asset => asset.id === assetId);
  const alreadyReserved = summary?.allocatedAmount ?? 0;
  const remainingToCover = Math.max(liability.remainingAmount - alreadyReserved, 0);
  const assetAvailable = selectedAsset ? Math.max(selectedAsset.value - (reservedByAsset.get(selectedAsset.id) ?? 0), 0) : 0;
  const maxAssignable = Math.min(remainingToCover, assetAvailable);
  const parsedAmount = Number(amount.replace(/\s/g, "").replace(",", "."));
  const valid = selectedAsset && Number.isFinite(parsedAmount) && parsedAmount > 0 && parsedAmount <= maxAssignable;

  async function allocate(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || !selectedAsset) return;
    setSaving(true); setError("");
    try {
      const next = await liabilityAllocationApi.allocate(liability.id, selectedAsset.id, parsedAmount);
      setSummary(next);
      setAmount("");
      await onChanged();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  async function release(allocation: LiabilityAllocation) {
    if (allocation.assetId == null) return;
    const raw = window.prompt("Ile zł zwolnić z rezerwy?", String(allocation.amount));
    if (!raw) return;
    const value = Number(raw.replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(value) || value <= 0 || value > allocation.amount) return;
    setSaving(true); setError("");
    try {
      const next = await liabilityAllocationApi.release(liability.id, allocation.assetId, value);
      setSummary(next);
      await onChanged();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  const effectiveRemaining = summary?.effectiveRemainingAmount ?? liability.remainingAmount;
  const image = liability.imageUrl || getDefaultLiabilityImage(liability.type, liability.name);

  return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
    <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-emerald-500/20 bg-[#0b1322] shadow-2xl shadow-black/50">
      <div className="relative overflow-hidden border-b border-slate-800 px-6 py-5">
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" style={{ objectPosition: liability.imagePosition ?? "center" }}/>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1322] via-[#0b1322]/95 to-[#0b1322]/70"/>
        <div className="relative flex items-start justify-between gap-4">
          <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-400">Asset → Liability Reserve</p><h2 className="mt-1 text-xl font-black text-white">Rezerwa · {liability.name}</h2><p className="mt-2 max-w-xl text-xs leading-5 text-slate-400">Środki pozostają w aktywie i nadal pracują. Nie zmniejszamy salda kredytu w banku ani podstawy naliczania odsetek.</p></div>
          <button type="button" onClick={onClose} className="cursor-pointer rounded-xl p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"><X size={19}/></button>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <ReserveStat label="Saldo w banku" value={money(liability.remainingAmount)} tone="text-blue-300"/>
          <ReserveStat label="Odłożone" value={money(alreadyReserved)} tone="text-emerald-300"/>
          <ReserveStat label="Efektywnie niepokryte" value={money(effectiveRemaining)} tone="text-amber-300"/>
        </div>

        {summary?.allocations.length ? <div className="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
          <p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-500">Z czego składa się rezerwa</p>
          <div className="mt-3 space-y-2">{summary.allocations.map(allocation => <div key={allocation.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/70 bg-slate-950/40 px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2"><ShieldCheck size={15} className="shrink-0 text-emerald-400"/><span className="truncate text-sm font-semibold text-slate-300">{allocation.assetName}</span></div>
            <div className="flex items-center gap-2"><strong className="text-sm text-white">{money(allocation.amount)}</strong>{allocation.assetId != null && <button type="button" disabled={saving} onClick={() => void release(allocation)} className="cursor-pointer rounded-lg border border-slate-700 px-2 py-1 text-[10px] font-black text-slate-400 transition hover:border-amber-400/40 hover:text-amber-300">ZWOLNIJ</button>}</div>
          </div>)}</div>
        </div> : null}

        <form onSubmit={allocate} className="space-y-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/[.035] p-5">
          <div><p className="text-sm font-black text-white">Przypisz kolejne środki</p><p className="mt-1 text-xs text-slate-500">Jedna złotówka może być zarezerwowana tylko raz — na cel albo na konkretne zobowiązanie.</p></div>
          <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[.14em] text-slate-500">Aktywo</span><select value={assetId ?? ""} onChange={event => { setAssetId(Number(event.target.value)); setAmount(""); }} disabled={saving || loading} className="w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-bold text-slate-200 outline-none focus:border-emerald-400/40">{portfolio.map(asset => <option key={asset.id} value={asset.id}>{asset.name} · {money(Math.max(asset.value - (reservedByAsset.get(asset.id) ?? 0), 0))} wolne</option>)}</select></label>
          {selectedAsset && <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-xs"><span className="text-slate-500">Dostępne w {selectedAsset.name}</span><strong className="text-slate-200">{money(assetAvailable)}</strong></div>}
          <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[.14em] text-slate-500">Kwota rezerwy</span><div className="flex gap-2"><input inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0,00" disabled={saving} className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-lg font-black text-white outline-none focus:border-emerald-400/40"/><button type="button" disabled={saving || maxAssignable <= 0} onClick={() => setAmount(maxAssignable.toFixed(2))} className="cursor-pointer rounded-xl border border-slate-700 px-3 text-xs font-black text-slate-300 hover:border-emerald-400/40 hover:text-emerald-300 disabled:opacity-40">MAX</button></div></label>
          <p className="text-xs text-slate-500">Możesz przypisać maksymalnie <strong className="text-slate-300">{money(maxAssignable)}</strong> z wybranego aktywa. Do pełnego pokrycia długu brakuje {money(remainingToCover)}.</p>
          {error && <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300">{error}</div>}
          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4"><button type="button" onClick={onClose} className="cursor-pointer rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-300">Zamknij</button><button type="submit" disabled={!valid || saving} className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"><PiggyBank size={16}/>{saving ? "Zapisuję…" : "PRZYPISZ ŚRODKI"}</button></div>
        </form>
      </div>
    </div>
  </div>;
}

function ReserveStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-600">{label}</p><p className={`mt-1 text-lg font-black ${tone}`}>{value}</p></div>;
}

function buildReservedByAsset(goalOverview: MoneyFlowOverview | null, liabilityOverview: LiabilityAllocationOverview | null) {
  const result = new Map<number, number>();
  for (const row of goalOverview?.allocations ?? []) {
    if (row.assetId != null) result.set(row.assetId, (result.get(row.assetId) ?? 0) + row.amount);
  }
  for (const row of liabilityOverview?.allocations ?? []) {
    if (row.assetId != null) result.set(row.assetId, (result.get(row.assetId) ?? 0) + row.amount);
  }
  return result;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Nie udało się wykonać operacji.";
}

function Hero({ title, value, subtitle, icon, tone, ghost }: { title: string; value: string; subtitle: string; icon: ReactNode; tone: "rose" | "amber" | "emerald" | "orange" | "violet"; ghost: ReactNode }) {
  const classes = {
    rose: "border-rose-500/25 from-rose-500/15 text-rose-400 hover:border-rose-400/45 hover:shadow-rose-950/30",
    amber: "border-amber-500/25 from-amber-500/15 text-amber-400 hover:border-amber-400/45 hover:shadow-amber-950/30",
    emerald: "border-emerald-500/25 from-emerald-500/15 text-emerald-400 hover:border-emerald-400/45 hover:shadow-emerald-950/30",
    orange: "border-orange-500/25 from-orange-500/15 text-orange-400 hover:border-orange-400/45 hover:shadow-orange-950/30",
    violet: "border-violet-500/25 from-violet-500/15 text-violet-400 hover:border-violet-400/45 hover:shadow-violet-950/30",
  }[tone];
  return <div className={`group relative cursor-default overflow-hidden rounded-2xl border bg-gradient-to-br ${classes} via-slate-900/85 to-slate-950 p-5 shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.015] hover:shadow-2xl`}>
    <div className="absolute -right-5 -top-5 opacity-[.07] transition-all duration-500 group-hover:-translate-x-2 group-hover:translate-y-2 group-hover:scale-110 group-hover:opacity-[.13]">{ghost}</div>
    <div className="relative"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/5 bg-slate-950/55 shadow-inner transition-transform duration-300 group-hover:scale-110">{icon}</div><p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{title}</p><p className="mt-1 text-2xl font-black tracking-tight text-white">{value}</p><p className="mt-1 text-xs text-slate-600">{subtitle}</p></div>
  </div>;
}

function CompactStat({ label, value, accent = "text-white" }: { label: string; value: string; accent?: string }) {
  return <div className="min-w-0 px-3 first:pl-0 last:pr-0"><p className="text-[10px] font-bold text-slate-500">{label}</p><p className={`mt-1 truncate text-base font-black ${accent}`}>{value}</p></div>;
}

function getDefaultLiabilityImage(type?: LiabilityType, name = "") {
  const normalized = name.toLowerCase();
  if (/dom|mieszkan|hipotek|nieruchomo/.test(normalized)) return "/liabilities/house.webp";
  if (/laptop|telefon|elektron|sprzęt|komputer|rtv|agd/.test(normalized)) return "/liabilities/laptop.webp";
  if (/karta|gotówk|pożycz|chwilów/.test(normalized)) return "/liabilities/card.webp";
  if (/auto|samoch|bmw|leasing|pojazd/.test(normalized)) return "/liabilities/car.webp";
  switch (type) {
    case "MORTGAGE": return "/liabilities/house.webp";
    case "INSTALLMENTS": return "/liabilities/laptop.webp";
    case "CREDIT_CARD":
    case "CASH_LOAN": return "/liabilities/card.webp";
    case "CAR_LOAN":
    case "LEASING": return "/liabilities/car.webp";
    default: return "/liabilities/card.webp";
  }
}

function getLiabilityAccent(type?: LiabilityType) {
  switch (type) {
    case "MORTGAGE": return { icon: "text-emerald-300", badge: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300", bar: "bg-emerald-400" };
    case "INSTALLMENTS": return { icon: "text-amber-300", badge: "border-amber-500/25 bg-amber-500/10 text-amber-300", bar: "bg-amber-400" };
    case "CREDIT_CARD": return { icon: "text-rose-300", badge: "border-rose-500/25 bg-rose-500/10 text-rose-300", bar: "bg-rose-400" };
    case "CAR_LOAN":
    case "LEASING": return { icon: "text-blue-300", badge: "border-blue-500/25 bg-blue-500/10 text-blue-300", bar: "bg-blue-400" };
    default: return { icon: "text-violet-300", badge: "border-violet-500/25 bg-violet-500/10 text-violet-300", bar: "bg-violet-400" };
  }
}

function formatLiabilityType(type?: LiabilityType) { return { MORTGAGE: "Hipoteka", CASH_LOAN: "Gotówkowy", CAR_LOAN: "Samochodowy", LEASING: "Leasing", INSTALLMENTS: "Raty", CREDIT_CARD: "Karta", OTHER: "Inne" }[type ?? "OTHER"]; }
function formatDebtAction(action: DebtAction) { return { ATTACK: "AGGRESSIVE PAYDOWN", CONSIDER: "CONSIDER OVERPAYMENT", NORMAL: "NORMAL PAYDOWN", KEEP: "LOW-COST DEBT" }[action]; }
function debtActionClasses(action: DebtAction) { return { ATTACK: "border-rose-500/20 bg-rose-500/5 text-rose-400", CONSIDER: "border-amber-500/20 bg-amber-500/5 text-amber-400", NORMAL: "border-blue-500/20 bg-blue-500/5 text-blue-400", KEEP: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" }[action]; }
