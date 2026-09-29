import { useState } from "react";
import { AlertTriangle, Banknote, BrainCircuit, CreditCard, Landmark, Pencil, Percent, Plus, Trash2, WalletCards } from "lucide-react";
import { AddLiabilityModal } from "../components/liabilities/AddLiabilityModal";
import { EditLiabilityModal } from "../components/liabilities/EditLiabilityModal";
import { getLiabilityIcon } from "../components/liabilities/LiabilityVisualFields";
import type { Liability, LiabilityType } from "../types/Liability";
import { analyzeDebts, type DebtAction } from "../features/intelligence/debtIntelligence";
import { calculateLiabilityProgress, calculateMonthlyDebtPayments, calculateTotalLiabilities } from "../utils/liabilities";

type Props = { liabilities: Liability[]; onAddLiability:(l:Liability)=>void; onUpdateLiability:(l:Liability)=>void; onDeleteLiability:(id:number)=>void };
const money=(v:number)=>`${v.toLocaleString("pl-PL")} zł`;

export function Liabilities({liabilities,onAddLiability,onUpdateLiability,onDeleteLiability}:Props) {
  const [isAddModalOpen,setIsAddModalOpen]=useState(false);
  const [editingLiability,setEditingLiability]=useState<Liability|null>(null);
  const totalLiabilities=calculateTotalLiabilities(liabilities);
  const monthlyPayments=calculateMonthlyDebtPayments(liabilities);
  const totalPrincipal=liabilities.reduce((s,l)=>s+(l.principalPayment??0),0);
  const totalInterest=liabilities.reduce((s,l)=>s+(l.interestPayment??0),0);
  const debtInsights=analyzeDebts(liabilities), topDebt=debtInsights[0]??null;
  function handleDelete(l:Liability){if(window.confirm(`Usunąć zobowiązanie "${l.name}"?`))onDeleteLiability(l.id)}

  return <main className="min-h-screen bg-[#050b16] p-8">
    <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/15 bg-red-500/10 text-red-400 shadow-lg shadow-red-950/20"><Landmark size={24}/></div><div><h1 className="text-3xl font-black tracking-tight">Zobowiązania</h1><p className="mt-1 text-sm text-slate-500">Kredyty, leasingi i inne zadłużenie. Kontroluj koszt kapitału.</p></div></div><button onClick={()=>setIsAddModalOpen(true)} className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:bg-blue-500"><Plus size={18}/>Dodaj zobowiązanie</button></div>

    <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Hero title="Łączny dług" value={money(totalLiabilities)} subtitle={`${liabilities.length} aktywnych zobowiązań`} icon={<CreditCard/>} tone="rose" ghost={<CreditCard size={92}/>}/>
      <Hero title="Łączne raty" value={money(monthlyPayments)} subtitle="Miesięczne obciążenie" icon={<WalletCards/>} tone="amber" ghost={<WalletCards size={92}/>}/>
      <Hero title="Kapitał w ratach" value={money(totalPrincipal)} subtitle={monthlyPayments?`${((totalPrincipal/monthlyPayments)*100).toFixed(1)}% rat`:"Brak rat"} icon={<Banknote/>} tone="emerald" ghost={<Banknote size={92}/>}/>
      <Hero title="Odsetki w ratach" value={money(totalInterest)} subtitle={monthlyPayments?`${((totalInterest/monthlyPayments)*100).toFixed(1)}% rat`:"Brak rat"} icon={<Percent/>} tone="orange" ghost={<Percent size={92}/>}/>
    </section>

    <section className="relative mt-7 overflow-hidden rounded-3xl border border-violet-500/20 bg-[#08111f] shadow-xl shadow-black/20">
      {topDebt && <><img src={topDebt.liability.imageUrl || getDefaultLiabilityImage(topDebt.liability.type, topDebt.liability.name)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-[.16] blur-[1px]"/><div className="absolute inset-0 bg-gradient-to-r from-[#08111f] via-[#08111f]/95 to-[#08111f]/70"/></>}
      <div className="relative p-6 lg:p-7">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/20"><BrainCircuit size={23}/></div><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-400">Debt Intelligence 3.1</p><h2 className="mt-1 text-2xl font-black">Strategia zobowiązań</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Priorytety długu w jednym miejscu — koszt, rata, pozostały kapitał i obraz tego, czego dotyczy zobowiązanie.</p></div></div>
          {topDebt&&<div className="group flex min-w-[320px] overflow-hidden rounded-2xl border border-amber-500/20 bg-slate-950/60 transition hover:-translate-y-0.5 hover:border-amber-400/35"><img src={topDebt.liability.imageUrl || getDefaultLiabilityImage(topDebt.liability.type, topDebt.liability.name)} className="h-24 w-28 object-cover transition duration-500 group-hover:scale-105"/><div className="p-4"><p className="text-[9px] font-black uppercase tracking-[.16em] text-amber-400">Pierwszy do analizy</p><p className="mt-1 text-lg font-black">{topDebt.liability.name}</p><p className="mt-1 text-xs text-slate-500">{topDebt.liability.interestRate.toLocaleString("pl-PL")}% · {formatDebtAction(topDebt.action)}</p></div></div>}
        </div>
        {debtInsights.length>0&&<div className="mt-6 grid gap-3 xl:grid-cols-3">{debtInsights.slice(0,3).map((i,index)=><div key={i.liability.id} className={`group relative min-h-[142px] overflow-hidden rounded-2xl border ${debtActionClasses(i.action)}`}><img src={i.liability.imageUrl || getDefaultLiabilityImage(i.liability.type, i.liability.name)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-[.20] transition duration-500 group-hover:scale-105 group-hover:opacity-[.27]"/><div className="absolute inset-0 bg-gradient-to-r from-[#08111f]/95 via-[#08111f]/88 to-[#08111f]/65"/><div className="relative p-4"><div className="flex justify-between gap-3"><p className="text-base font-black">#{index+1} {i.liability.name}</p><span className="text-xs font-black">{i.liability.interestRate.toLocaleString("pl-PL")}%</span></div><p className="mt-2 text-[10px] font-black uppercase tracking-[.12em]">{formatDebtAction(i.action)}</p><p className="mt-2 max-w-sm text-xs leading-5 text-slate-400">{i.reason}</p></div></div>)}</div>}
        <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-600"><AlertTriangle size={15} className="mt-0.5 shrink-0"/><p>To heurystyka FREEDOM do porządkowania zobowiązań, nie indywidualna rekomendacja kredytowa.</p></div>
      </div>
    </section>

    <section className="mt-7 space-y-5">{liabilities.map(l=><LiabilityCard key={l.id} liability={l} onEdit={()=>setEditingLiability(l)} onDelete={()=>handleDelete(l)}/>)}{liabilities.length===0&&<div className="rounded-3xl border border-dashed border-slate-700 p-16 text-center"><Landmark size={40} className="mx-auto text-slate-600"/><h2 className="mt-4 text-xl font-black">Brak zobowiązań</h2><p className="mt-2 text-sm text-slate-500">I bardzo dobrze 😎</p></div>}</section>

    {isAddModalOpen&&<AddLiabilityModal onClose={()=>setIsAddModalOpen(false)} onAdd={onAddLiability}/>} {editingLiability&&<EditLiabilityModal liability={editingLiability} onClose={()=>setEditingLiability(null)} onUpdate={onUpdateLiability}/>} 
  </main>
}

function LiabilityCard({liability:l,onEdit,onDelete}:{liability:Liability;onEdit:()=>void;onDelete:()=>void}){
  const progress=calculateLiabilityProgress(l);
  const paid=Math.max(l.originalAmount-l.remainingAmount,0);
  const Icon=getLiabilityIcon(l.iconKey);
  const imageSrc=l.imageUrl || getDefaultLiabilityImage(l.type, l.name);
  const accent=getLiabilityAccent(l.type);

  return <article className="group overflow-hidden rounded-2xl border border-slate-800/90 bg-[#0a1424] shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-2xl hover:shadow-black/25">
    <div className="grid min-h-[178px] lg:grid-cols-[220px_minmax(0,1fr)_310px]">
      <div className="relative min-h-[170px] overflow-hidden bg-slate-950 lg:min-h-full">
        <img
          src={imageSrc}
          alt={l.name}
          className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.055] ${l.imagePosition==="top"?"object-top":l.imagePosition==="bottom"?"object-bottom":"object-center"}`}
          onError={(event)=>{
            const fallback=getDefaultLiabilityImage(l.type, l.name);
            if(event.currentTarget.src.endsWith(fallback)) return;
            event.currentTarget.src=fallback;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0a1424]/35 lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[#0a1424]/90"/>
        <div className={`absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-950/70 ${accent.icon} shadow-lg backdrop-blur`}>
          <Icon size={20}/>
        </div>
      </div>

      <div className="flex min-w-0 flex-col justify-center px-5 py-5 lg:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-black tracking-tight text-white">{l.name}</h2>
          <span className={`rounded-lg border px-2 py-1 text-[9px] font-black uppercase tracking-[.12em] ${accent.badge}`}>{formatLiabilityType(l.type)}</span>
          {l.interestRate>=8&&<span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-[.12em] text-amber-300">High cost</span>}
        </div>
        <p className="mt-2 text-sm text-slate-500">Spłacono {money(paid)} z {money(l.originalAmount)}</p>

        <div className="mt-5 flex items-end gap-2">
          <p className="text-2xl font-black text-white">{money(paid)}</p>
          <p className="pb-1 text-sm font-semibold text-slate-500">/ {money(l.originalAmount)}</p>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-800">
            <div className={`h-full rounded-full ${accent.bar} transition-all duration-500`} style={{width:`${Math.min(progress,100)}%`}}/>
          </div>
          <span className="w-12 text-right text-base font-black text-slate-200">{progress.toFixed(0)}%</span>
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-500">Pozostało do spłaty: <span className="text-slate-300">{money(l.remainingAmount)}</span></p>
      </div>

      <div className="relative flex items-center border-t border-slate-800/80 px-5 py-5 lg:border-l lg:border-t-0">
        <div className="absolute right-3 top-3 flex gap-1.5">
          <button type="button" onClick={onEdit} title="Edytuj" className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-blue-500/10 hover:text-blue-300"><Pencil size={17}/></button>
          <button type="button" onClick={onDelete} title="Usuń" className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-300"><Trash2 size={17}/></button>
        </div>
        <div className="grid w-full grid-cols-3 divide-x divide-slate-800 pt-5 lg:pt-0">
          <CompactStat label="Rata miesięczna" value={money(l.monthlyPayment)} />
          <CompactStat label="Pozostało" value={money(l.remainingAmount)} accent="text-blue-300" />
          <CompactStat label="Oprocentowanie" value={`${l.interestRate.toLocaleString("pl-PL")}%`} accent={l.interestRate>=8?"text-amber-300":"text-white"}/>
        </div>
      </div>
    </div>
  </article>
}

function Hero({title,value,subtitle,icon,tone,ghost}:{title:string;value:string;subtitle:string;icon:React.ReactNode;tone:"rose"|"amber"|"emerald"|"orange";ghost:React.ReactNode}){
  const c={
    rose:"border-rose-500/25 from-rose-500/15 text-rose-400 hover:border-rose-400/45 hover:shadow-rose-950/30",
    amber:"border-amber-500/25 from-amber-500/15 text-amber-400 hover:border-amber-400/45 hover:shadow-amber-950/30",
    emerald:"border-emerald-500/25 from-emerald-500/15 text-emerald-400 hover:border-emerald-400/45 hover:shadow-emerald-950/30",
    orange:"border-orange-500/25 from-orange-500/15 text-orange-400 hover:border-orange-400/45 hover:shadow-orange-950/30"
  }[tone];
  return <div className={`group relative cursor-default overflow-hidden rounded-2xl border bg-gradient-to-br ${c} via-slate-900/85 to-slate-950 p-5 shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.015] hover:shadow-2xl`}>
    <div className="absolute -right-5 -top-5 opacity-[.07] transition-all duration-500 group-hover:-translate-x-2 group-hover:translate-y-2 group-hover:scale-110 group-hover:opacity-[.13]">{ghost}</div>
    <div className="relative">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/5 bg-slate-950/55 shadow-inner transition-transform duration-300 group-hover:scale-110">{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-600">{subtitle}</p>
    </div>
  </div>
}

function CompactStat({label,value,accent="text-white"}:{label:string;value:string;accent?:string}){
  return <div className="min-w-0 px-3 first:pl-0 last:pr-0">
    <p className="text-[10px] font-bold text-slate-500">{label}</p>
    <p className={`mt-1 truncate text-base font-black ${accent}`}>{value}</p>
  </div>
}

function getDefaultLiabilityImage(type?:LiabilityType,name=""){
  const n=name.toLowerCase();
  if(/dom|mieszkan|hipotek|nieruchomo/.test(n)) return "/liabilities/house.webp";
  if(/laptop|telefon|elektron|sprzęt|komputer|rtv|agd/.test(n)) return "/liabilities/laptop.webp";
  if(/karta|gotówk|pożycz|chwilów/.test(n)) return "/liabilities/card.webp";
  if(/auto|samoch|bmw|leasing|pojazd/.test(n)) return "/liabilities/car.webp";
  switch(type){
    case "MORTGAGE": return "/liabilities/house.webp";
    case "INSTALLMENTS": return "/liabilities/laptop.webp";
    case "CREDIT_CARD":
    case "CASH_LOAN": return "/liabilities/card.webp";
    case "CAR_LOAN":
    case "LEASING": return "/liabilities/car.webp";
    default: return "/liabilities/card.webp";
  }
}
function getLiabilityAccent(type?:LiabilityType){
  switch(type){
    case "MORTGAGE": return {icon:"text-emerald-300",badge:"border-emerald-500/25 bg-emerald-500/10 text-emerald-300",bar:"bg-emerald-400"};
    case "INSTALLMENTS": return {icon:"text-amber-300",badge:"border-amber-500/25 bg-amber-500/10 text-amber-300",bar:"bg-amber-400"};
    case "CREDIT_CARD": return {icon:"text-rose-300",badge:"border-rose-500/25 bg-rose-500/10 text-rose-300",bar:"bg-rose-400"};
    case "CAR_LOAN":
    case "LEASING": return {icon:"text-blue-300",badge:"border-blue-500/25 bg-blue-500/10 text-blue-300",bar:"bg-blue-400"};
    default: return {icon:"text-violet-300",badge:"border-violet-500/25 bg-violet-500/10 text-violet-300",bar:"bg-violet-400"};
  }
}

function formatLiabilityType(type?:LiabilityType){return {MORTGAGE:"Hipoteka",CASH_LOAN:"Gotówkowy",CAR_LOAN:"Samochodowy",LEASING:"Leasing",INSTALLMENTS:"Raty",CREDIT_CARD:"Karta",OTHER:"Inne"}[type??"OTHER"]}
function formatDebtAction(action:DebtAction){return {ATTACK:"AGGRESSIVE PAYDOWN",CONSIDER:"CONSIDER OVERPAYMENT",NORMAL:"NORMAL PAYDOWN",KEEP:"LOW-COST DEBT"}[action]}
function debtActionClasses(action:DebtAction){return {ATTACK:"border-rose-500/20 bg-rose-500/5 text-rose-400",CONSIDER:"border-amber-500/20 bg-amber-500/5 text-amber-400",NORMAL:"border-blue-500/20 bg-blue-500/5 text-blue-400",KEEP:"border-emerald-500/20 bg-emerald-500/5 text-emerald-400"}[action]}
